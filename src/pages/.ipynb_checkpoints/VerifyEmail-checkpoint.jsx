import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CircularProgress, Typography, Box } from "@mui/material";
import axios from "axios";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      return;
    }

    axios
      .get(`https://employee-inspection-backend.onrender.com/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  return (
    <Box textAlign="center" mt={10}>
      {status === "loading" && (
        <>
          <CircularProgress />
          <Typography mt={2}>Verifying your email...</Typography>
        </>
      )}
      {status === "success" && (
        <Typography variant="h5" color="primary">
          ✅ Your email has been successfully verified!
        </Typography>
      )}
      {status === "error" && (
        <Typography variant="h6" color="error">
          ❌ Invalid or expired verification link.
        </Typography>
      )}
    </Box>
  );
}