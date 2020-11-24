const fs = require("fs");
const { exec } = require("child_process");
const colors = require("colors");
const { resolve, parse } = require("path");

class VideoConverter {
  constructor() {
    this.videosToConvert;
    this.index = 0;
    this.getFiles = this.getFiles;
    this.convertVideos = this.convertVideos;
    this.debug = true;
    this.getFiles(this.convertVideos); // Start process
  }

  convertVideos = () => {
    if (this.videosToConvert[this.index] === undefined) {
      return;
    }

    let currentVideo = this.videosToConvert[this.index];
    this.logger({
      type: "stage",
      message:
        "Converting video: " +
        `[${this.index + 1}/${this.videosToConvert.length}]`,
      stage: 2,
      end: currentVideo,
    });
    const mp4File = currentVideo;
    const mp3File = currentVideo.replace(".mp4", "_audio.mp3");
    const outputFile = "conv" + mp4File;

    const cmd = `ffmpeg.exe -i "${mp4File}" -i "${mp3File}" "${outputFile}"`;
    let child = exec(cmd, (err, stdout, stderr) => {
      if (err) {
        this.logger({
          type: "error",
          message: "exec error",
          end: err.name,
        });
        return console.log(err);
      }

      if (stdout && process.argv.includes("-v"))
        console.log(`\t\t\t+[[[stdout]]]+:\n ${stdout}`);
      if (stderr && process.argv.includes("-v")) {
        this.logger({
          type: "error",
          message: `stderr: ${stderr}`,
        });
      }
      // increment index to point to the next video file
      this.index++;
      // call self to convert next video
      this.logger({
        type: "done",
        message: " Finished Converting video: ",
        stage: `${this.index}/${this.videosToConvert.length}`,
        end: currentVideo,
      });

      this.convertVideos();
    });

    child.stdout.on("close", () => {
      return this.moveVideos();
    });
  };

  getFiles = (cb) => {
    this.logger({
      type: "stage",
      message: "Preparing videos for",
      stage: 1,
      end: "[STAGE 2]",
    });

    let files,
      tmpFiles,
      mp4Files = [];
    files = this.readDir(__dirname, ["mp4"]);

    files.forEach((file) => {
      const { name: fileName } = parse(file);
      if (file.includes("mp4") && this.exists(fileName + "_audio.mp3", true)) {
        if (!this.exists("tmp", true)) {
          // check if tmp folder exists
          this.mkdir("tmp"); // create tmp folder
        }

        // Check if file haven't been converted and is not in temp directory
        // To prevent converting same file again
        let tempFiles = this.readDir("tmp", ["mp4"], true);
        if (!file.includes("conv") && !tempFiles.includes(file)) {
          mp4Files.push(file);
        }
      } else {
        this.logger({
          type: "error",
          message: `File not found:`,
          wnd: file.replace(".mp4", "_audio.mp3"),
        });
        process.exit(1);
      }
    });

    this.videosToConvert = mp4Files;

    cb();
  };

  readDir(path, exts = false, resolvePath = false) {
    if (process.argv.includes("-d")) {
      this.logger({
        type: "debug",
        message: `readDir called with args: [path]=${path}, [exts]=${exts} [resolvePath]=${resolvePath}`,
      });
    }
    resolvePath ? (path = resolve(path)) : path;
    let files = [];
    let filesToReturn = [];
    try {
      files = fs.readdirSync(path);
    } catch (err) {
      this.logger({
        type: "error",
        message: "Could not read directory:",
        end: path,
      });
      process.exit(1);
    }

    if (exts) {
      files.forEach((file) => {
        let push = false;
        exts.forEach((ext) => {
          if (file.includes(ext)) {
            push++;
          }
        });

        if (push === exts.length) {
          filesToReturn.push(file);
        }
      });
    } else {
      filesToReturn = files;
    }
    if (process.argv.includes("-d")) {
      this.logger({
        type: "debug",
        message: `readDir result:`,
        end: filesToReturn,
      });
    }
    return filesToReturn;
  }

  exists(path, resolvePath = false) {
    if (process.argv.includes("-d")) {
      this.logger({
        type: "debug",
        message: `exists called with args: [path]=${path}, [resolvePath]=${resolvePath}`,
      });
    }
    resolvePath ? (path = resolve(path)) : path;
    let exists;
    try {
      exists = fs.existsSync(path);
      if (process.argv.includes("-d")) {
        this.logger({
          type: "debug",
          message: `exists result:`,
          end: exists,
        });
      }
      return exists;
    } catch (err) {
      this.logger({
        type: "error",
        message: err.name,
      });
      console.log(err);
      process.exit(1);
    }
  }

  mkdir(path, resolvePath = false) {
    if (process.argv.includes("-d")) {
      this.logger({
        type: "debug",
        message: `mkdir called with args: [path]=${path}, [resolvePath]=${resolvePath}`,
      });
    }
    resolvePath ? (path = resolve(path)) : path;
    if (this.exists(path)) {
      this.logger({
        type: "error",
        message: `Directory: ${parse(path).name} already exists.`,
      });
    }
    // create directory
    try {
      fs.mkdirSync(path);
      if (process.argv.includes("-d")) {
        this.logger({
          type: "debug",
          message: "mkdir called to create direcotry & result:",
          end: true,
        });
      }
      return true;
    } catch (err) {
      logger({
        type: "error",
        message: `Could not create directory: ${parse(path).name}`.blue,
        end: err.name,
      });
      if (process.argv.includes("-d")) {
        this.logger({
          type: "debug",
          message: "mkdir called result: [error]",
          end: false,
        });
      }
      console.log(err);
      return false;
    }
  }

  moveVideos = () => {
    try {
      const videosToMove = this.readDir(__dirname, ["conv"]);
      videosToMove.forEach((video) => {
        try {
          fs.renameSync(
            __dirname + "/" + video,
            __dirname + "/tmp/" + `${video.replace("conv", "")}`
          );
          this.logger({
            type: "info",
            message: "Successfully moved convertd video to tmp directory.",
            end: video,
          });
        } catch (err) {
          this.logger({
            type: "error",
            message: "Error moving file ",
            end: video,
          });
          console.log(err);
        }
      });
    } catch (err) {
      this.logger({
        type: "error",
        message: "Error reading converted videos.",
        end: err.name,
      });
      console.log(err);
      process.exit(1);
    }
  };

  logger(opts) {
    opts = {
      type: opts.type || "error",
      message: opts.message || "No message provided",
      stage: opts.stage || "",
      end: opts.end || null,
    };
    const { type, message, stage, end } = opts;
    let msg;
    switch (type) {
      case "error":
        msg = ["[ERROR]".brightYellow.inverse, message.blue];
        if (end) msg.push(`${end}`.red.inverse);
        console.log(...msg);
        break;
      case "stage":
        msg = [`[STAGE ${stage}]`.yellow.inverse, message.cyan.bold];
        if (end) msg.push(`${end}`.blue.bold);
        console.log(...msg);
        break;
      case "done":
        msg = [`[DONE ${stage}]`.green.inverse, message.cyan.bold];
        if (end) msg.push(`${end}`.blue.bold);
        console.log(...msg);
        break;
      case "info":
        msg = [`[INFO]`.america, message.white.inverse];
        if (end) msg.push(`${end}`.blue.bold);
        console.log(...msg);
        break;
      case "debug":
        msg = [`[DEBUG]`.brightMagenta.inverse, message.cyan.bold];
        if (end) msg.push(`${end}`.blue.bold);
        console.log(...msg);
        break;
      default:
        msg = [`[${type} ${stage}]`, message.rainbow];
        if (end) msg.push(`${end}`.blue.bold);
        console.log(...msg);
    }
  }
}

if (process.argv.includes("-c")) {
  let videoConverter = new VideoConverter();
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("\t\t\tHere's the available arguments you can use\t\t".rainbow);
  console.log(
    "\t\t-c  Use this arg to merge mp3 files with mp4 files in current working directory"
  );
  console.log(
    "\t\t-v  Use this arg if you want the output of the ffmpeg executable"
  );
  console.log("\t\t-d  Use this arg for debugging");
  console.log("\n\n");
  console.log(
    "\t\tTo use this script first make sure it's in the same directory as your mp3 & mp4 files."
  );
  console.log(
    "\t\tYou must name the mp3 files the same name as the mp4 files that you want them to be merged\n\t\tand add _audio before the extention name."
  );
  console.log(
    "\t\tFor example:\n\t\tmp4 file name-> ",
    "'hello world.mp4'\n".cyan.bold,
    "\t\tthe mp3 file should look like this ->",
    "'hello world_audio.mp3'".cyan.bold
  );
}

if (require.main == module && process.argv.length === 2) {
  console.log("call with -h for help".white.bold.inverse);
}

module.exports = VideoConverter;
