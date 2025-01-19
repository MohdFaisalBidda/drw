"use client";

import React from "react";
import { SigninAction } from "../../../actions";
import { useRouter } from "next/navigation";

function Signin() {
  const router = useRouter();
  const [userData, setUserData] = React.useState({
    username: "",
    password: "",
  });

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await SigninAction(userData);
    console.log(res, "res");
    if (res) {
      localStorage.setItem("token", res.token);
      router.push("/");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="username"
        id=""
        value={userData.username}
        onChange={handleOnChange}
      />
      <input
        type="password"
        name="password"
        id=""
        value={userData.password}
        onChange={handleOnChange}
      />
      <button type="submit">submit</button>
    </form>
  );
}

export default Signin;
