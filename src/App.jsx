import { useState, useRef } from "react";
import "./App.css";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

function App() {
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);
  const messageRef = useRef(null);

  // const worker = new Worker(WorkerFile);
  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      messageRef.current.innerHTML = message;
      console.log(message);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });
    setLoaded(true);
  };

  const transcode = async () => {
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile(
      "input.webm",
      await fetchFile(
        "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm",
      ),
    );
    await ffmpeg.exec(["-i", "input.webm", "output.mp4"]);
    const data = await ffmpeg.readFile("output.mp4");
    videoRef.current.src = URL.createObjectURL(
      new Blob([data.buffer], { type: "video/mp4" }),
    );
  };

  console.log(loaded);

  return (
    <>
      <div>
        <span>choose file:</span>
        <input multiple type="file" />
        <div className="event-log">
          <label htmlFor="eventLog">Upload status:</label>
          <ul id="status">
            <li id="status-upload-start">
              Upload started:<span>x</span>
            </li>
            <li id="status-progress-start">
              Upload in progress:<span>x</span>
            </li>
            <li id="status-progress-end">
              Upload ended:<span>x</span>
            </li>
            <li id="status-names">
              Uploaded filenames:<span>x</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="card">
        <button onClick={load}>load</button>
        <button onClick={transcode}>transcode</button>
        <video ref={videoRef} controls></video>
        <p ref={messageRef}></p>
      </div>
    </>
  );
}

export default App;
