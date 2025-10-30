import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState("Loading...");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/test")
      .then((res) => {
        setData(res.data.message);
      })
      .catch((err) => {
        console.error(err);
        setData("Error connecting to backend");
      });
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>{data}</h1>
      <p style={{ color: "gray" }}>React ↔ Laravel connection test</p>
    </div>
  );
}

export default App;
