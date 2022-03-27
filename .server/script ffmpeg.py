#SCRIPT FFMPEG - GDIE

import os

##Recorte de los fragmentos de video
os.system("ffmpeg -ss 00:00:00 -i sabana.mp4 -t 00:00:07 -c copy 1.mp4")
os.system("ffmpeg -ss 00:00:00 -i pajaros.mp4 -t 00:00:08 -c copy 2.mp4")
os.system("ffmpeg -ss 00:23:50 -i oceano.mp4 -t 00:00:10 -c copy 3.mp4")
os.system("ffmpeg -ss 00:00:24 -i sabana.mp4 -t 00:00:10 -c copy 4.mp4")
os.system("ffmpeg -ss 00:23:06 -i oceano.mp4 -t 00:00:08 -c copy 5.mp4")

os.system("ffmpeg -ss 00:06:57 -i pajaros.mp4 -t 00:00:08 -c copy 6.mp4")
os.system("ffmpeg -ss 00:03:08 -i sabana.mp4 -t 00:00:08 -c copy 7.mp4")
os.system("ffmpeg -ss 00:07:45 -i insectos.mp4 -t 00:00:10 -c copy 8.mp4")
os.system("ffmpeg -ss 00:07:07 -i pajaros.mp4 -t 00:00:10 -c copy 9.mp4")
os.system("ffmpeg -ss 00:02:09 -i sabana.mp4 -t 00:00:10 -c copy 10.mp4")

os.system("ffmpeg -ss 00:06:57 -i insectos.mp4 -t 00:00:10 -c copy 11.mp4")
os.system("ffmpeg -ss 00:28:28 -i oceano.mp4 -t 00:00:10 -c copy 12.mp4")
os.system("ffmpeg -ss 00:08:00 -i insectos.mp4 -t 00:00:10 -c copy 13.mp4")
os.system("ffmpeg -ss 00:01:41 -i sabana.mp4 -t 00:00:10 -c copy 14.mp4")
os.system("ffmpeg -ss 00:07:50 -i pajaros.mp4 -t 00:00:09 -c copy 15.mp4")

os.system("ffmpeg -ss 00:01:55 -i sabana.mp4 -t 00:00:10 -c copy 16.mp4")
os.system("ffmpeg -ss 00:04:02 -i sabana.mp4 -t 00:00:10 -c copy 17.mp4")
os.system("ffmpeg -ss 00:09:54 -i insectos.mp4 -t 00:00:10 -c copy 18.mp4")
os.system("ffmpeg -ss 00:02:44 -i sabana.mp4 -t 00:00:07 -c copy 19.mp4")
os.system("ffmpeg -ss 00:11:44 -i pajaros.mp4 -t 00:00:10 -c copy 20.mp4")

#Igualación de la base temporal de los arxhivos anteriores
for x in range(1,21):
    os.system("ffmpeg -i "+ str(x)+".mp4 -video_track_timescale 15360 "+ str(x+20)+".mp4")

#Concatenación de los videos igualados
os.system("ffmpeg -f concat -i videos.txt -c copy finalVideo.mp4")

#Elimar audio del video
os.system("ffmpeg -i finalVideo.mp4 -c copy -an finalVideoNoAudio.mp4")

#Introducción de nuevo audio
os.system("ffmpeg -i finalVideoNoAudio.mp4 -i audio.mp3 -map 0:v -map 1:a -c:v copy -shortest conAudio.mp4")

#Transformación a webm
os.system("ffmpeg -i conAudio.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -b:a 128k -c:a libopus conAudio2.webm")

#Captura cada segundo
