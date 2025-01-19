"use client";

import React, { useState } from "react";
import { createUser } from "../../../actions";

function Signup() {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form
      method="POST"
      action={() => createUser(userData)}
      className="flex flex-col space-y-4"
    >
      <input
        type="text"
        placeholder="username"
        name="username"
        value={userData.username}
        onChange={handleOnChange}
        className="p-2 text-black border-2 border-black rounded-lg"
      />
      <input
        type="email"
        placeholder="email"
        name="email"
        value={userData.email}
        onChange={handleOnChange}
        className="p-2 text-black border-2 border-black rounded-lg"
      />
      <input
        type="password"
        id=""
        name="password"
        value={userData.password}
        onChange={handleOnChange}
        className="p-2 text-black border-2 border-black rounded-lg"
      />
      <button
        type="submit"
        className="p-2 text-black border-2 border-black rounded-lg"
      >
        submit
      </button>
    </form>
  );
}

export default Signup;
