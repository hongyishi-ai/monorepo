import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <App />
);
// 在任意组件中添加以下代码进行测试
export default function TestComponent() {
    return (
      <div className="bg-blue-500 text-white p-4 rounded-lg">
        Tailwind CSS 正常工作！
      </div>
    );
  }