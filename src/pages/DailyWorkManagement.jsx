import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Tag,
  Input,
  Select,
  DatePicker,
  Button,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  Typography,
  Alert,
  Pagination,
  Empty,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getWorkersListAsync,
  getDailyWorksAsync,
  createDailyWorkAsync,
  updateDailyWorkAsync,
  deleteDailyWorkAsync,
} from "../store/services/dailyWorkService";
import "./DailyWorkManagement.css";

const { Title } = Typography;
const { RangePicker } = DatePicker;

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

const ATTENDANCE_COLOR = { present: "success", absent: "error" };
const STATUS_COLOR = { pending: "warning", inprogress: "processing", completed: "success" };

const money = (v) => (v !== undefined && v !== null && v !== "" ? `Rs. ${Number(v).toLocaleString()}` : "—");
const labelOf = (opts, v) => opts.find((o) => o.value === v)?.label || v || "—";

const DailyWorkManagement = () => {
  const dispatch = useDispatch();
  const { entries = [], pagination = {}, get_status, get_error: error, workersList = [] } =
    useSelector((state) => state.dailyWork || {});
  const { total = 0 } = pagination;
  const loading = get_status === "loading";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [worker, setWorker] = useState("");
  const [attendance, setAttendance] = useState(undefined);
  const [workStatus, setWorkStatus] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();

  const buildParams = useCallback(
    (overrides = {}) => {
      const params = { page, limit: pageSize, worker: worker || undefined, attendance, workStatus, ...overrides };
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format("DD/MM/YYYY");
        params.endDate = dateRange[1].format("DD/MM/YYYY");
      }
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      return params;
    },
    [page, pageSize, worker, attendance, workStatus, dateRange],
  );

  const fetchList = useCallback((overrides = {}) => dispatch(getDailyWorksAsync(buildParams(overrides))), [
    dispatch,
    buildParams,
  ]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, attendance, workStatus, dateRange]);

  useEffect(() => {
    dispatch(getWorkersListAsync());
  }, [dispatch]);

  const resetFilters = () => {
    setWorker("");
    setAttendance(undefined);
    setWorkStatus(undefined);
    setDateRange(null);
    setPage(1);
  };

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      employerId: record.employerId?._id || record.employerId,
      entryDate: record.entryDate ? dayjs(record.entryDate, "DD/MM/YYYY") : null,
    });
    setFormOpen(true);
  };

  const closeFormModal = () => {
    setFormOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // Selecting a worker auto-fills that worker's base salary for the day —
  // still editable in case today's rate is different (special-rate day).
  const handleWorkerChange = (employerId) => {
    const w = workersList.find((x) => x._id === employerId);
    if (w) form.setFieldsValue({ salary: w.salary });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        ...values,
        entryDate: values.entryDate ? values.entryDate.format("DD/MM/YYYY") : undefined,
      };
      if (editingRecord) {
        await dispatch(updateDailyWorkAsync({ id: editingRecord._id, ...payload })).unwrap();
      } else {
        await dispatch(createDailyWorkAsync(payload)).unwrap();
      }
      closeFormModal();
      fetchList();
    } catch (err) {
      // validation errors show inline; thunk rejections surface via `error`
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    setDeletingId(record._id);
    try {
      await dispatch(deleteDailyWorkAsync(record._id)).unwrap();
      fetchList();
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Worker",
        key: "worker",
        width: 160,
        render: (_, r) => r.employerId?.name || "—",
      },
      { title: "Date", dataIndex: "entryDate", key: "entryDate", width: 110 },
      { title: "Site", dataIndex: "currentSite", key: "currentSite", render: (v) => v || "—" },
      {
        title: "Attendance",
        dataIndex: "attendance",
        key: "attendance",
        render: (v) => <Tag color={ATTENDANCE_COLOR[v] || "default"}>{labelOf(ATTENDANCE_OPTIONS, v)}</Tag>,
      },
      {
        title: "Status",
        dataIndex: "workStatus",
        key: "workStatus",
        render: (v) => <Tag color={STATUS_COLOR[v] || "default"}>{labelOf(WORK_STATUS_OPTIONS, v)}</Tag>,
      },
      { title: "Salary", dataIndex: "salary", key: "salary", render: money },
      {
        title: "Overtime",
        key: "overtime",
        render: (_, r) => `${r.overtimeHours || 0} hrs (${money(r.overtimeAmount)})`,
      },
      { title: "Advance", dataIndex: "advanceAmount", key: "advanceAmount", render: money },
      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 100,
        render: (_, record) => (
          <div className="dw-actions-cell">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
            <Popconfirm
              title="Delete this entry?"
              okText="Delete"
              okButtonProps={{ danger: true, loading: deletingId === record._id }}
              onConfirm={() => handleDelete(record)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    [deletingId],
  );

  return (
    <div className="dw-root">
      <div className="dw-header">
        <div>
          <Title level={3} className="dw-title">
            Daily Work / Attendance
          </Title>
          <span className="dw-subtitle">Add each worker's day — site, attendance, overtime, advance</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Daily Entry
        </Button>
      </div>

      {error && <Alert type="error" showIcon message={typeof error === "string" ? error : "Something went wrong"} className="dw-error-alert" />}

      <div className="dw-filters-card">
        <div className="dw-filters">
          <Input
            allowClear
            placeholder="Search by worker name…"
            className="dw-filter"
            value={worker}
            onChange={(e) => setWorker(e.target.value)}
            onPressEnter={() => {
              setPage(1);
              fetchList({ worker: worker || undefined, page: 1 });
            }}
          />
          <Select
            allowClear
            className="dw-filter"
            placeholder="Attendance"
            options={ATTENDANCE_OPTIONS}
            value={attendance}
            onChange={(v) => {
              setAttendance(v);
              setPage(1);
            }}
          />
          <Select
            allowClear
            className="dw-filter"
            placeholder="Work Status"
            options={WORK_STATUS_OPTIONS}
            value={workStatus}
            onChange={(v) => {
              setWorkStatus(v);
              setPage(1);
            }}
          />
          <RangePicker
            className="dw-filter"
            format="DD/MM/YYYY"
            value={dateRange}
            onChange={(v) => {
              setDateRange(v);
              setPage(1);
            }}
          />
          <Button type="link" icon={<ReloadOutlined />} onClick={resetFilters}>
            Reset
          </Button>
          <span className="dw-result-count">{total} entr{total === 1 ? "y" : "ies"}</span>
        </div>
      </div>

      <Spin spinning={loading}>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={entries}
          scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty description="No daily work entries found" /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Spin>

      <Modal
        open={formOpen}
        onCancel={closeFormModal}
        title={editingRecord ? "Edit Daily Entry" : "Add Daily Entry"}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="dw-form-grid">
            <Form.Item
              label="Worker"
              name="employerId"
              rules={[{ required: true, message: "Select a worker" }]}
            >
              <Select
                showSearch
                disabled={!!editingRecord}
                placeholder="Select worker"
                optionFilterProp="label"
                onChange={handleWorkerChange}
                options={workersList.map((w) => ({
                  value: w._id,
                  label: `${w.name} (${w.workerId})`,
                }))}
              />
            </Form.Item>
            <Form.Item label="Current Site" name="currentSite">
              <Input placeholder="e.g. DHA Phase 8" />
            </Form.Item>
            <Form.Item label="Attendance" name="attendance" rules={[{ required: true, message: "Select attendance" }]}>
              <Select options={ATTENDANCE_OPTIONS} placeholder="Select" />
            </Form.Item>
            <Form.Item label="Work Status" name="workStatus">
              <Select options={WORK_STATUS_OPTIONS} placeholder="Select" />
            </Form.Item>
            <Form.Item label="Work Under" name="workUnder">
              <Select options={WORK_UNDER_OPTIONS} placeholder="Select" />
            </Form.Item>
            <Form.Item
              label="Salary (this day)"
              name="salary"
              tooltip="Auto-filled from the worker's base salary — override for a special-rate day"
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
            <Form.Item label="Overtime (hrs)" name="overtimeHours">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
            <Form.Item label="Advance" name="advanceAmount">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
            <Form.Item label="Entry Date" name="entryDate" tooltip="Khali chhodein to aaj ki date lagegi">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" allowClear />
            </Form.Item>
          </div>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional notes…" />
          </Form.Item>
          <Form.Item className="dw-form-actions">
            <Button type="primary" htmlType="submit" loading={submitting} block>
              {editingRecord ? "Save changes" : "Add entry"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DailyWorkManagement;