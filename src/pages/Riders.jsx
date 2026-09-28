import React, { useEffect, useMemo, useRef, useState } from "react";
import authAxios from "../utils/authAxios";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  // Riders come from the Google Sheet (read-only); these are the columns shown.
  const columns = {
    rider_id: "",
    first_name: "",
    first_last_name: "",
    id_number: "",
    city_code: "",
    vehicle_type: "",
    box_serial_number: "",
    plate_number: "",
    joined_at: "",
  };

  const PAGE_SIZE = 200;
  const [errorMsg, setErrorMsg] = useState("");
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const fetchRiders = async (q) => {
    // Cancel any in-flight request
    try {
      abortRef.current?.abort?.();
    } catch (_) {}

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorMsg("");

    try {
      // Backend filters the cached sheet by `q` and returns at most `limit` matches.
      const params = { q, limit: PAGE_SIZE };

      const res = await authAxios.get("/riders", {
        params,
        signal: controller.signal,
      });

      const data = Array.isArray(res.data) ? res.data : [];
      const qq = (q || "").toLowerCase();

      // Keep only matches (the backend already filters; this guards against an older backend).
      const filteredData = !qq
        ? []
        : data
            .filter((r) =>
              [
                r.rider_id,
                r.first_name,
                r.first_last_name,
                r.id_number,
                r.city_code,
                r.vehicle_type,
                r.plate_number,
                r.box_serial_number,
              ]
                .map((v) => (v ? v.toString().toLowerCase() : ""))
                .some((v) => v.includes(qq))
            )
            .slice(0, PAGE_SIZE);

      setRiders(filteredData);

      if (filteredData.length === PAGE_SIZE) {
        setErrorMsg(
          "Showing the first 200 matches. Refine your search to narrow it down."
        );
      }
    } catch (error) {
      // If request was aborted, ignore
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return;
      }

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      // No fallback: this page is search-only.
      setRiders([]);
      setErrorMsg(
        "Failed to search riders."
      );
      console.error("Fetch riders error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Search-only mode: do not load riders on mount.
    return () => {
      try {
        abortRef.current?.abort?.();
      } catch (_) {}
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Debounced server search
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = search.trim();

    debounceRef.current = setTimeout(() => {
      // Search-only mode:
      // - empty search => show nothing
      // - short search (<2) => show nothing
      if (!q) {
        setRiders([]);
        setErrorMsg("");
        setLoading(false);
        return;
      }

      if (q.length < 2) {
        setRiders([]);
        setErrorMsg("");
        setLoading(false);
        return;
      }

      fetchRiders(q);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(() => riders, [riders]);

  return (
    <Box sx={{ minHeight: "100vh", width: "100vw", backgroundColor: "#f7fafd" }}>
      <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", py: 6 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Riders</Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <SearchIcon color="action" />
            <TextField
              label="Search riders"
              variant="standard"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
        </Paper>
        {errorMsg ? (
          <Typography sx={{ mt: 1, color: "text.secondary" }}>{errorMsg}</Typography>
        ) : search.trim().length < 2 ? (
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Start typing to search for a rider (minimum 2 characters).
          </Typography>
        ) : (
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Showing matching riders.
          </Typography>
        )}
        <Paper elevation={2}>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
              <Typography>Loading riders{search.trim() ? " (searching...)" : "..."}</Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Typography sx={{ p: 4 }}>
              {search.trim().length < 2
                ? "Search for a rider to see results."
                : "No riders found."}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ background: "#f5f5f5" }}>
                  <TableRow>
                    {Object.keys(columns).map((key) => (
                      <TableCell key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((rider) => (
                    <TableRow key={rider.rider_id}>
                      {Object.keys(columns).map((key) => (
                        <TableCell key={key}>{key === 'joined_at' ? rider[key]?.slice(0, 10) : rider[key]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
}