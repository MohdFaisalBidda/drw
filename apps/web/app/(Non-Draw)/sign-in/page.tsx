import React, { Suspense } from "react";
import Signin from "../../_components/Auth/Signin";

function page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Signin />
    </Suspense>
  );
}

export default page;
