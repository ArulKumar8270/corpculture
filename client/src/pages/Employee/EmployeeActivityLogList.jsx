import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  TextField,
  Button,
  TablePagination,
  Chip,
} from "@mui/material";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const EmployeeActivityLogList = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const isAdmin = Number(auth?.user?.role) === 1;

  const fetchLogs = async (
    from = fromDate,
    to = toDate,
    currentPage = page,
    currentRows = rowsPerPage
  ) => {
    if (!auth?.token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage + 1),
        limit: String(currentRows),
      });
      if (from) params.append("fromDate", from);
      if (to) params.append("toDate", to);

      const { data } = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/my-logs?${params.toString()}`,
        { headers: { Authorization: auth.token } }
      );

      if (data?.success) {
        setLogs(data.activityLogs || []);
        setTotalCount(data.totalCount || 0);
      } else {
        setLogs([]);
        setTotalCount(0);
        setError(data?.message || "Failed to fetch activity logs.");
        toast.error(data?.message || "Failed to fetch activity logs.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch activity logs.");
      toast.error("Failed to fetch activity logs.");
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token, page, rowsPerPage]);

  const handleFilter = () => {
    setPage(0);
    fetchLogs(fromDate, toDate, 0, rowsPerPage);
  };

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setPage(0);
    fetchLogs("", "", 0, rowsPerPage);
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ mb: 2, color: "#019ee3", fontWeight: "bold" }}
      >
        My Petrol Forms
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "flex-end",
          }}
        >
          <TextField
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
          <Button variant="contained" onClick={handleFilter}>
            Filter
          </Button>
          <Button variant="outlined" onClick={handleClear}>
            Clear
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 250,
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ p: 2, textAlign: "center" }}>
            {error}
          </Typography>
        ) : logs.length === 0 ? (
          <Typography sx={{ p: 2, textAlign: "center" }}>
            No activity logs found.
          </Typography>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>From</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>To</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>KM</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>In</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Out</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Call Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Remarks</TableCell>
                    {isAdmin ? (
                      <TableCell sx={{ fontWeight: "bold" }} align="center">
                        Actions
                      </TableCell>
                    ) : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, idx) => {
                    const fromName =
                      log.fromCompany?.companyName || log.fromCompanyName || "—";
                    const toName =
                      log.toCompany?.companyName || log.toCompanyName || "—";
                    const fromAddr = [log.fromAddressLine, log.fromPincode]
                      .filter(Boolean)
                      .join(" — ");
                    const toAddr = [log.toAddressLine, log.toPincode]
                      .filter(Boolean)
                      .join(" — ");
                    return (
                      <TableRow key={log._id} hover>
                        <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          {log.date ? dayjs(log.date).format("DD/MM/YYYY") : "—"}
                        </TableCell>
                        <TableCell>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span>{fromName}</span>
                            {fromAddr ? (
                              <span style={{ fontSize: 12, color: "#666" }}>
                                {fromAddr}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span>{toName}</span>
                            {toAddr ? (
                              <span style={{ fontSize: 12, color: "#666" }}>
                                {toAddr}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{log.km ?? "—"}</TableCell>
                        <TableCell>{log.inTime || "—"}</TableCell>
                        <TableCell>{log.outTime || "—"}</TableCell>
                        <TableCell>
                          {log.callType ? (
                            <Chip
                              label={log.callType}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.status || "UNPAID"}
                            size="small"
                            color={log.status === "PAID" ? "success" : "warning"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{log.remarks || "—"}</TableCell>
                        {isAdmin ? (
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() =>
                                navigate("/admin/dashboard/activity-log", {
                                  state: { editLogId: log._id },
                                })
                              }
                            >
                              Edit
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default EmployeeActivityLogList;

