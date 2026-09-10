import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Select,
  DatePicker,
  Button,
  Typography,
  Input,
  InputNumber,
  Empty,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import {
  getWorkersListAsync,
  bulkCreateDailyWorkAsync,
} from "../store/services/dailyWorkService";
import "./BulkDailyWorkAdd.css";

const { Title } = Typography;

const ATTENDANCE_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
];
const WORK_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];
const WORK_UNDER_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "partnerShip", label: "Partnership" },
  { value: "client", label: "Client" },
];
const DESIGNATION_OPTIONS = [
  { value: "mazdoor", label: "Mazdoor" },
  { value: "qarigar", label: "Qarigar" },
];
const labelOf = (opts, v) => opts.find((o) => o.value === v)?.label || v || "—";

// A blank per-day row — used whenever a new date gets ticked on the calendar.
const emptyRow = (defaultSalary) => ({
  currentSite: "",
  workStatus: undefined,
  workUnder: undefined,
  salary: defaultSalary,
  overtimeHours: 0,
  advanceAmount: 0,
  description: "",
});

// =====================================================================
// Full page (not a modal) — add the same worker's daily work for several
// dates at once. Worker + Attendance are common for the whole batch;
// everything else (site, status, work-under, salary, overtime, advance,
// description) is editable per-day, since each day's work can differ.
// =====================================================================
const BulkDailyWorkAdd = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workersList = [] } = useSelector((state) => state.dailyWork || {});

  const [employerId, setEmployerId] = useState(undefined);
  const [attendance, setAttendance] = useState("present");
  const [dates, setDates] = useState([]);
  const [rows, setRows] = useState({}); // { "DD/MM/YYYY": rowData }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(getWorkersListAsync());
  }, [dispatch]);

  const selectedWorker = workersList.find((w) => w._id === employerId);

  const handleWorkerChange = (id) => {
    setEmployerId(id);
    const w = workersList.find((x) => x._id === id);
    const defaultSalary = w?.salary;
    // Existing rows ka salary sirf tab update karo jab user ne khud change
    // na kiya ho — simplest/safe: naya worker select hote hi sab rows ka
    // salary reset kar do (multi-day batch ek hi worker ke liye hoti hai,
    // worker change matlab fresh start).
    setRows((prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        next[key] = { ...prev[key], salary: defaultSalary };
      });
      return next;
    });
  };

  const handleDatesChange = (list) => {
    const sorted = [...(list || [])].sort((a, b) => a.valueOf() - b.valueOf());
    setDates(sorted);
    setRows((prev) => {
      const next = {};
      sorted.forEach((d) => {
        const key = d.format("DD/MM/YYYY");
        next[key] = prev[key] || emptyRow(selectedWorker?.salary);
      });
      return next;
    });
  };

  const updateRow = (dateKey, field, value) => {
    setRows((prev) => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!employerId) {
      toast.error("Pehle worker select karein.");
      return;
    }
    if (!attendance) {
      toast.error("Attendance select karein.");
      return;
    }
    if (dates.length === 0) {
      toast.error("Kam se kam ek date select karein.");
      return;
    }

    const dateStrings = dates.map((d) => d.format("DD/MM/YYYY"));
    const perDateOverrides = {};
    dateStrings.forEach((key) => {
      const row = rows[key] || {};
      perDateOverrides[key] = {
        currentSite: row.currentSite,
        workStatus: row.workStatus,
        workUnder: row.workUnder,
        salary: row.salary,
        overtimeHours: row.overtimeHours,
        advanceAmount: row.advanceAmount,
        description: row.description,
      };
    });

    setSubmitting(true);
    try {
      const result = await dispatch(
        bulkCreateDailyWorkAsync({
          employerId,
          dates: dateStrings,
          attendance,
          perDateOverrides,
        }),
      ).unwrap();
      toast.success(result?.message || "Daily work entries created successfully.");
      navigate("/daily-work");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Entries save nahi ho sakin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bdw-root">
      <div className="bdw-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          className="bdw-back-btn"
          onClick={() => navigate("/daily-work")}
        >
          Back
        </Button>
        <Title level={3} className="bdw-title">
          Add Daily Work — Multiple Days
        </Title>
        <span className="bdw-subtitle">
          Ek worker, kai dates — har din ka kaam (site, salary, overtime, advance, notes) alag likh sakte hain
        </span>
      </div>

      <div className="bdw-card">
        <div className="bdw-common-grid">
          <div className="bdw-field">
            <label className="bdw-field-label">Worker</label>
            <Select
              showSearch
              placeholder="Select worker"
              optionFilterProp="label"
              className="bdw-field-control"
              value={employerId}
              onChange={handleWorkerChange}
              options={workersList.map((w) => ({
                value: w._id,
                label: `${w.name} (${labelOf(DESIGNATION_OPTIONS, w.designation)})`,
              }))}
            />
          </div>
          <div className="bdw-field">
            <label className="bdw-field-label">Attendance (sab dates ke liye)</label>
            <Select
              placeholder="Select attendance"
              className="bdw-field-control"
              value={attendance}
              onChange={setAttendance}
              options={ATTENDANCE_OPTIONS}
            />
          </div>
          <div className="bdw-field bdw-field--wide">
            <label className="bdw-field-label">Dates</label>
            <DatePicker
              multiple
              format="DD/MM/YYYY"
              placeholder="Calendar se dates chunein"
              className="bdw-field-control"
              style={{ width: "100%" }}
              value={dates}
              onChange={handleDatesChange}
            />
          </div>
        </div>
      </div>

      {dates.length === 0 ? (
        <Empty
          description="Worker select karke calendar se dates chunein — har date ka apna form neeche aa jayega"
          className="bdw-empty"
        />
      ) : (
        <div className="bdw-day-list">
          {dates.map((d) => {
            const key = d.format("DD/MM/YYYY");
            const row = rows[key] || emptyRow(selectedWorker?.salary);
            return (
              <div className="bdw-day-card" key={key}>
                <div className="bdw-day-card-header">{key}</div>
                <div className="bdw-day-grid">
                  <div className="bdw-field">
                    <label className="bdw-field-label">Site</label>
                    <Input
                      placeholder="e.g. DHA Phase 8"
                      className="bdw-field-control"
                      value={row.currentSite}
                      onChange={(e) => updateRow(key, "currentSite", e.target.value)}
                    />
                  </div>
                  <div className="bdw-field">
                    <label className="bdw-field-label">Work Status</label>
                    <Select
                      allowClear
                      placeholder="Select"
                      className="bdw-field-control"
                      value={row.workStatus}
                      onChange={(v) => updateRow(key, "workStatus", v)}
                      options={WORK_STATUS_OPTIONS}
                    />
                  </div>
                  <div className="bdw-field">
                    <label className="bdw-field-label">Work Under</label>
                    <Select
                      allowClear
                      placeholder="Select"
                      className="bdw-field-control"
                      value={row.workUnder}
                      onChange={(v) => updateRow(key, "workUnder", v)}
                      options={WORK_UNDER_OPTIONS}
                    />
                  </div>
                  <div className="bdw-field">
                    <label className="bdw-field-label">Salary</label>
                    <InputNumber
                      min={0}
                      placeholder="0"
                      className="bdw-field-control"
                      style={{ width: "100%" }}
                      value={row.salary}
                      onChange={(v) => updateRow(key, "salary", v)}
                    />
                  </div>
                  <div className="bdw-field">
                    <label className="bdw-field-label">Overtime (hrs)</label>
                    <InputNumber
                      min={0}
                      placeholder="0"
                      className="bdw-field-control"
                      style={{ width: "100%" }}
                      value={row.overtimeHours}
                      onChange={(v) => updateRow(key, "overtimeHours", v)}
                    />
                  </div>
                  <div className="bdw-field">
                    <label className="bdw-field-label">Advance</label>
                    <InputNumber
                      min={0}
                      placeholder="0"
                      className="bdw-field-control"
                      style={{ width: "100%" }}
                      value={row.advanceAmount}
                      onChange={(v) => updateRow(key, "advanceAmount", v)}
                    />
                  </div>
                  <div className="bdw-field bdw-field--wide">
                    <label className="bdw-field-label">Description (is din ka kaam)</label>
                    <Input.TextArea
                      rows={2}
                      placeholder="Is din kya kaam hua…"
                      className="bdw-field-control"
                      value={row.description}
                      onChange={(e) => updateRow(key, "description", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bdw-footer-bar">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          size="large"
          block
          loading={submitting}
          disabled={dates.length === 0}
          onClick={handleSubmit}
        >
          Save all entries {dates.length > 0 ? `(${dates.length})` : ""}
        </Button>
      </div>
    </div>
  );
};

export default BulkDailyWorkAdd;
