import openai
import pyaudio
import wave
import threading
import queue
import os
import time
import nltk
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from janome.tokenizer import Tokenizer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from collections import Counter
from flask_cors import CORS

# NLTKのデータセットをダウンロード
nltk.download('punkt')
nltk.download('stopwords')


# Flaskアプリの設定
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app)  # CORSを有効にする
socketio = SocketIO(app, cors_allowed_origins="*")

# 新しいAPIクライアントのインスタンスを作成
client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# 音声録音設定
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
RECORD_SECONDS = 5  # 録音間隔
WAVE_OUTPUT_FILENAME = "output.wav"
SAVE_DIR = "saved_data"  # 保存ディレクトリ

# 保存するディレクトリの設定
SAVE_DIR = 'saved_files'
os.makedirs(SAVE_DIR, exist_ok=True)

# 録音中かどうかを示すフラグ
recording_active = False

# ディレクトリが存在しない場合は作成
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

# キューを使って録音データを管理
audio_queue = queue.Queue()
text_queue = queue.Queue()

# 設定の初期値
settings = {
    'summary_interval': 60  # 要約を行う時間間隔（秒）
}

# PyAudioオブジェクトをグローバルに定義
p = pyaudio.PyAudio()

# 音声を録音するスレッド
def record_audio():
    global recording_active  # グローバル変数を参照
    try:
        stream = p.open(format=FORMAT,
                        channels=CHANNELS,
                        rate=RATE,
                        input=True,
                        frames_per_buffer=CHUNK * 2)  # バッファサイズを増加
    except Exception as e:
        print(f"Error opening stream: {e}")
        return

    print("Recording...")

    while True:
        try:
            if recording_active:
                frames = []
                for _ in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
                    data = stream.read(CHUNK, exception_on_overflow=False)  # オーバーフロー例外を無視
                    frames.append(data)
                audio_queue.put(frames)
            else:
                time.sleep(0.1)  # 短い遅延を入れてCPU使用率を下げる
        except Exception as e:
            print(f"Error in record_audio: {e}")
            break  # ストリームが閉鎖された場合、ループを終了

    try:
        stream.stop_stream()
        stream.close()
    except Exception as e:
        print(f"Error closing stream: {e}")

# 文字起こしを行うスレッド
def transcribe_audio():
    while True:
        try:
            frames = audio_queue.get()
            wf = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(p.get_sample_size(FORMAT))
            wf.setframerate(RATE)
            wf.writeframes(b''.join(frames))
            wf.close()

            with open(WAVE_OUTPUT_FILENAME, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
                print("Transcription:", transcription)  # レスポンス全体を出力して確認する

                # transcriptionが文字列の場合、そのまま使用
                text_queue.put(transcription)
                socketio.emit('transcription', {'data': transcription})
            
            # キューが空になったことを通知
            audio_queue.task_done()
        except Exception as e:
            print(f"Error in transcribe_audio: {e}")

# 要約と客観的な回答を行うスレッド
def summarize_and_respond():
    accumulated_text = ""
    accumulated_summary = ""
    last_summary_time = time.time()
    
    while True:
        try:
            current_time = time.time()
            text = text_queue.get()
            accumulated_text += " " + text

            if current_time - last_summary_time >= settings['summary_interval']:
                # 新しい情報を基に要約を更新
                print("Sending summary request to OpenAI API")
                summary_response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "あなたは非常に優れた要約者です。以下のテキストを簡潔かつ明確に要約してください。重要なポイントを逃さず、ビジネスにおいて最も関連性の高い情報を強調してください。"},
                        {"role": "user", "content": accumulated_summary + " " + accumulated_text}
                    ]
                )
                accumulated_summary = summary_response.choices[0].message.content
                print("Updated Summary:", accumulated_summary)

                # 客観的な回答を生成
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "あなたはトップレベルのビジネスコンサルタントです。以下の要約に基づいて、客観的で実用的なビジネスインサイトとアドバイスを提供してください。具体的な行動提案とビジネス戦略を含めてください。"},
                        {"role": "user", "content": accumulated_summary}
                    ]
                )
                response_content = response.choices[0].message.content
                print("Generated Response:", response_content)

                # キーポイントの抽出
                # 要約と客観的な回答の両方からキーポイントを抽出
                combined_text = accumulated_summary + " " + response_content
                key_points = extract_key_points(combined_text)

                # 保存処理
                save_data(accumulated_text, accumulated_summary, response_content)

                socketio.emit('summary', {'data': accumulated_summary})
                socketio.emit('response', {'data': response_content})
                socketio.emit('keyPoints', {'data': key_points})
                accumulated_text = ""
                last_summary_time = current_time
            
            # キューが空になったことを通知
            text_queue.task_done()
        except Exception as e:
            print(f"Error in summarize_and_respond: {e}")

def extract_key_points(text):
    # 日本語のトークナイザー
    janome_tokenizer = Tokenizer()

    # 英語のストップワードを取得
    english_stop_words = set(stopwords.words('english'))

    # カスタム日本語ストップワードリスト
    japanese_stop_words = set([
        "の", "に", "は", "を", "た", "が", "で", "て", "と", "し", "れ", "さ", "ある",
        "いる", "も", "する", "から", "な", "こと", "として", "い", "や", "れる",
        "ない", "なる", "へ", "及び", "その", "ため", "において", "によって", "また"
    ])

    # トークン化とストップワードの除去
    words = word_tokenize(text)
    filtered_words = []

    for word in words:
        if all(ord(char) < 128 for char in word):  # 英語の単語
            if word.lower() not in english_stop_words and word.isalnum():
                filtered_words.append(word)
        else:  # 日本語の単語
            tokens = janome_tokenizer.tokenize(word, wakati=True)
            filtered_words.extend([token for token in tokens if token not in japanese_stop_words and token.isalnum()])

    # 単語の出現頻度をカウントし、上位5つのキーワードを抽出
    word_counts = Counter(filtered_words)
    common_words = word_counts.most_common(5)

    key_points = [word for word, count in common_words]
    return key_points


def save_data(transcription, summary, response):
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    data = {
        'transcription': transcription,
        'summary': summary,
        'response': response
    }
    file_path = os.path.join(SAVE_DIR, f"conversation_{timestamp}.txt")
    with open(file_path, 'w', encoding='utf-8') as file:
        for key, value in data.items():
            file.write(f"{key.capitalize()}:\n{value}\n\n")
    print(f"Data saved to {file_path}")

@app.route('/')
def index():
    return render_template('index.html')

# 設定更新エンドポイント
@socketio.on('updateSettings')
def handle_update_settings(data):
    global settings
    settings['summary_interval'] = data['summaryInterval']
    print(f"Settings updated: {settings}")


@app.route('/view_history/<filename>')
def view_history(filename):
    file_path = os.path.join(SAVE_DIR, filename)
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        return jsonify({'content': content})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/history')
def history():
    try:
        files = os.listdir(SAVE_DIR)
        files = sorted(files, reverse=True)  # 最新のファイルを上に表示
        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/start_recording', methods=['POST'])
def start_recording():
    global recording_active
    recording_active = True
    print("Recording started")  # ログに出力
    return jsonify({'status': 'Recording started'})

@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    global recording_active
    recording_active = False
    print("Recording stopped")  # ログに出力
    return jsonify({'status': 'Recording stopped'})

if __name__ == '__main__':
    record_thread = threading.Thread(target=record_audio)
    transcribe_thread = threading.Thread(target=transcribe_audio)
    summarize_thread = threading.Thread(target=summarize_and_respond)

    record_thread.start()
    transcribe_thread.start()
    summarize_thread.start()

    port = int(os.environ.get('PORT', 5000))  # デフォルトのポートを5000に設定
    socketio.run(app, host='0.0.0.0', port=port)
