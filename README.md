# nodejs-merge-audio-and-video
Nodejs project to combine videos and audio files with the ffmpeg command-line video converter.

## Problem
I was looking for a software to merge audio files with mp4 files.
I have looked everywhere for a solution to merge hundreds of videos with a simple software but all of the solution that were out there required that you do it manually one by one and it would only convert one by one.


### Installation

This project requires [Node.js](https://nodejs.org/)

Install the dependencies and devDependencies and start the script.

# Important!!
The mp4 files that you want to merge must be in the same directory as the script and the audio files.
Also, the names of the audio files must have the same name as the video files and include "_audio" before the extention name. 

For example:
- Video File: "Our last trip.mp4"
The audio file must be in this format.
- Audio File: "Our last trip_audio.mp3"

```sh
$ cd nodejs-merge-audio-and-video
$ npm install
$ node VideoConverter.js -c
```

## Arguments
| Argument | Description |
| ------ | ------ |
| -c | To start the conversion |
| -v | To get the output from the ffmpeg executable |
| -d | used for debuging |
| -h | display help menu |

### Todos

 - Support more conversions
 - Make configuration flexible and user friendly
 - Support threading for faster conversions

License
----

MIT
