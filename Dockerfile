# Pythonのベースイメージを指定
FROM python:3.9

# 作業ディレクトリを設定
WORKDIR /app

# 必要なシステム依存関係をインストール
RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    build-essential \
    alsa-utils \
    && apt-get clean


# Pythonの依存関係をインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# オーディオデバイスのパーミッション設定
RUN usermod -a -G audio root

# アプリケーションのコードをコピー
COPY . .

# 環境変数を読み込む
ENV $(cat .env | xargs)

# ALSA設定ファイルを追加
RUN mkdir -p /etc/alsa && echo "defaults.pcm.card 0\ndefaults.ctl.card 0" > /etc/alsa/alsa.conf

# ポート8080を公開
EXPOSE 8080

# アプリケーションを実行
CMD ["python", "app.py"]
