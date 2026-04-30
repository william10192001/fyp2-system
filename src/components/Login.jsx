import { useNavigate } from "react-router-dom";

function Login({ onLogin, goRegister }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    onLogin(email, password);
  };

  return (
    ...
    <p
      onClick={() => navigate("/forgot")}
      className="mt-2 text-sm text-red-400 cursor-pointer text-center"
    >
      Forgot Password?
    </p>
  );
}