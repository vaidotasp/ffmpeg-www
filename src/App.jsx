import { useState, useRef, useEffect } from "react";
import "./App.css";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

function App() {
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);
  const messageRef = useRef(null);
  const filesRef = useRef(null);
  const fileurl = useRef(null);

  // const worker = new Worker(WorkerFile);
  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      // console.log(message);
      messageRef.current.innerHTML = message;
      // console.log(message);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript",
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

  async function processFile(file, index) {
    console.log("processing");
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile("input.webm", await fetchFile(file));
    await ffmpeg.exec(["-i", "input.webm", "output.mp4"]);
    const data = await ffmpeg.readFile("output.mp4");
    // const data = await ffmpeg.readFile("output.mp4");
    const oURL = URL.createObjectURL(
      new Blob([data.buffer], { type: "video/mp4" }),
    );
    fileurl.current = oURL;
    console.log(oURL);
    videoRef.current.src = URL.createObjectURL(
      new Blob([data.buffer], { type: "video/mp4" }),
    );
  }

  async function handleGo() {
    console.log("handle go");
    const fileList = filesRef?.current?.files;
    // processFile(fileList[0], 1);
    const filesToProcess = [];
    console.log(Array.from(fileList));
    processFile(fileList[0], 1);
    // Array.from(fileList).forEach((f, i) => {
    //   // console.log(f, index);
    //   filesToProcess.push(processFile(f, i));
    // });

    // console.log(filesToProcess);

    // for (let i = 0; i < Array.from(fileList); i++) {
    // console.log(Array.from(fileList[i]));
    // processFile(fileList[i], i);
    // filesToProcess.push(processFile(fileList[i], i));
    // }
    // Promise.all(filesToProcess).then((s) => {
    //   console.log(s);
    // });
    // console.log(filesToProcess);
  }

  console.log("loaded", loaded);

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div>
        <span>choose file:</span>
        {/* <input multiple type="file" /> */}
        <div className="event-log">
          <input ref={filesRef} multiple type="file" />
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
        <button onClick={handleGo}>transcode</button>
        <button
          onClick={() => {
            const anchor = document.createElement("a");
            anchor.href = fileurl.current;
            anchor.download = "name";
            document.body.appendChild(anchor);
            anchor.click();

            // Clean up
            document.body.removeChild(anchor);
            URL.revokeObjectURL(fileurl.current);
          }}
        >
          download
        </button>
        <video ref={videoRef} controls></video>
        <p ref={messageRef}></p>
      </div>
    </>
  );
}

export default App;
