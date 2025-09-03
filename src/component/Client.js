import React from 'react';
import { FaUserCircle } from 'react-icons/fa'; // FontAwesome user icon

function Client({ username }) {
  return (
    <div className="d-flex align-items-center mb-3">
      <FaUserCircle size={50} className="mr-3" />
      <span className="mx-2">{username.toString()}</span>
    </div>
  );
}

export default Client;
