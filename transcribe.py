import openai
import pyaudio
import wave
import threading
import queue
import os
import time
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

# Flaskアプリの設定
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# 新しいAPIクライアントのインスタンスを作成
client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# 音声録音設定
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
RECORD_SECONDS = 5  # 録音間隔
WAVE_OUTPUT_FILENAME = "output.wav"
SUMMARY_INTERVAL = 60  # 要約を行う時間間隔（秒）

# キューを使って録音データを管理
audio_queue = queue.Queue()
text_queue = queue.Queue()

# PyAudioオブジェクトをグローバルに定義
p = pyaudio.PyAudio()

# 音声を録音するスレッド
def record_audio():
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)

    print("Recording...")

    while True:
        try:
            frames = []
            for _ in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
                data = stream.read(CHUNK)
                frames.append(data)
            audio_queue.put(frames)
        except Exception as e:
            print(f"Error in record_audio: {e}")

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

# 要約を行うスレッド
def summarize_text():
    accumulated_text = ""
    accumulated_summary = ""
    last_summary_time = time.time()
    
    while True:
        try:
            current_time = time.time()
            text = text_queue.get()
            accumulated_text += " " + text

            if current_time - last_summary_time >= SUMMARY_INTERVAL:
                # 新しい情報を基に要約を更新
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "あなたは優れた要約者です。以下のテキストを要約してください。"},
                        {"role": "user", "content": accumulated_summary + " " + accumulated_text}
                    ]
                )
                accumulated_summary = response.choices[0].message.content  # 修正箇所
                print("Updated Summary:", accumulated_summary)
                socketio.emit('summary', {'data': accumulated_summary})
                accumulated_text = ""
                last_summary_time = current_time
            
            # キューが空になったことを通知
            text_queue.task_done()
        except Exception as e:
            print(f"Error in summarize_text: {e}")

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    record_thread = threading.Thread(target=record_audio)
    transcribe_thread = threading.Thread(target=transcribe_audio)
    summarize_thread = threading.Thread(target=summarize_text)

    record_thread.start()
    transcribe_thread.start()
    summarize_thread.start()

    socketio.run(app, debug=True)
