import "./RegisterForm.css";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerThunk } from "../../redux/slices/authSlice";

const RegisterForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLoginOptionClicked = () => {
    navigate("/login");
  };

  const handleRegister = async (values) => {
    const payload = {
      email: values.email,
      password: values.password,
      full_name: values.fullName,
      phone: values.phoneNumber,
      role_name: "Volunteer",
    };

    try {
      const resultAction = await dispatch(registerThunk(payload));

      if (registerThunk.fulfilled.match(resultAction)) {
        message.success("Register successfully! Please log in.");
        alert("Register successfully!");
        navigate("/login");
      } else {
        // lỗi do rejectWithValue
        const errMsg =
          resultAction.payload || "Register failed, please try again.";
        alert(
          `${resultAction.payload || "Register failed, please try again."}`
        );
        message.error(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error while registering");
      message.error("Unexpected error while registering");
    }
  };

  return (
    <div className="registerForm-container">
      <div className="registerForm-box">
        <h2>Register</h2>
        <Form layout="vertical" onFinish={handleRegister}>
          <Form.Item label="Full name" name="fullName">
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item label="Phone number" name="phoneNumber">
            <Input placeholder="Enter your phone number" />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input placeholder="Enter your email" />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input.Password placeholder="Enter your password" />
          </Form.Item>
          <Form.Item label="Confirm Password" name="confirmPassword">
            <Input.Password placeholder="Confirm your password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Register
            </Button>
          </Form.Item>
        </Form>
        <div className="registerForm-options">
          <div className="login-option">
            Already have an account?{" "}
            <span onClick={handleLoginOptionClicked}>Login</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
