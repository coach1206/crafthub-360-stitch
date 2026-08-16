import React from "react";
import { Navigate } from "react-router-dom";

/**
 * CraftHub public landing is the SmokeCraft guest journey.
 * The former NOVEE / POS3 / E.A.T. ecosystem overview is not a guest landing page
 * and must not intercept SmokeCraft launch.
 */
export default function CraftHub() {
  return <Navigate to="/smokecraft/welcome" replace />;
}
