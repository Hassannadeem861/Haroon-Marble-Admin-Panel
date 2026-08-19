import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Tag,
  Input,
  Select,
  DatePicker,
  Button,
  Modal,
  Drawer,
  Form,
  InputNumber,
  Popconfirm,
  Typography,
  Alert,
  Pagination,
  Descriptions,
  Empty,
  Spin,
  Avatar,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getEmployersAsync,
  getSingleEmployerAsync,
  createEmployerAsync,
  updateEmployerAsync,
  deleteEmployerAsync,
} from "../store/services/employerService";
import { clearSelectedWorker } from "../store/slices/employerSlice";
import "./WorkerManagement.css";

const { Title } = Typography;

// ---- static option lists (mirrors the Mongoose enum values) ----
const DESIGNATION_OPTIONS = [
  { value: "mazdoor", label: "Mazdoor" },
  { value: "qarigar", label: "Qarigar" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const WORK_STATUS_LABEL = {
  pending: { label: "Pending", color: "warning" },
  inprogress: { label: "In Progress", color: "processing" },
  completed: { label: "Completed", color: "success" },
};

const UNDER_WORK_LABEL = {
  owner: { label: "Owner", color: "default" },
  partnerShip: { label: "Partner Ship", color: "processing" },
  client: { label: "Client", color: "success" },
};

const ATTENDANCE_LABEL = {
  present: { label: "Present", color: "success" },
  absent: { label: "Absent", color: "error" },
};

const fmtDate = (d) => (d ? dayjs(d).format("DD MMM YYYY, hh:mm A") : "—");
const money = (v) =>
  v !== undefined && v !== null && v !== ""
    ? `Rs. ${Number(v).toLocaleString()}`
    : "—";

const statusLabel = (opts, val) =>
  opts.find((o) => o.value === val)?.label || val || "—";

// Turn a "totalOvertime" style key into "Total Overtime" for generic summary rendering,
// since the exact salary-slip summary shape isn't fixed on the frontend side.
const humanizeKey = (key) =>
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

// Keys ending in "Days" or "Hours" are counts, never currency — even
// though some (e.g. totalOvertimeHours) contain the word "total".
const isCountKey = (key) => /Days$|Hours$/i.test(key);
const isMoneyKey = (key) =>
  !isCountKey(key) && /salary|amount|advance|pay|net|gross|total/i.test(key);

// =====================================================================
// Mobile card — one worker (master profile)
// =====================================================================
const WorkerCard = ({ record, onView, onEdit, onDelete, deleting }) => (
  <div className={`wm-card wm-card--${record.status || "active"}`}>
    <div className="wm-card-top">
      <Avatar size={40} icon={<UserOutlined />} className="wm-avatar" />
      <div className="wm-card-top-info">
        <div className="wm-card-name">{record.name}</div>
        <div className="wm-card-workerid">
          <IdcardOutlined /> {record.workerId}
        </div>
      </div>
      <Tag color={record.status === "active" ? "success" : "default"}>
        {statusLabel(STATUS_OPTIONS, record.status)}
      </Tag>
    </div>

    <div className="wm-card-grid">
      <div>
        <div className="wm-card-field-label">Designation</div>
        <div className="wm-card-field-value">
          {statusLabel(DESIGNATION_OPTIONS, record.designation)}
        </div>
      </div>
      <div>
        <div className="wm-card-field-label">Base Salary</div>
        <div className="wm-card-field-value">{money(record.salary)}</div>
      </div>
      <div>
        <div className="wm-card-field-label">Entry Date</div>
        <div className="wm-card-field-value">{record.entryDate || "—"}</div>
      </div>
    </div>

    <div className="wm-card-actions">
      <Button icon={<EyeOutlined />} onClick={() => onView(record)}>
        View
      </Button>
      <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
        Edit
      </Button>
      <Popconfirm
        title="Delete this worker?"
        description={`Remove ${record.name} permanently?`}
        okText="Delete"
        okButtonProps={{ danger: true, loading: deleting }}
        onConfirm={() => onDelete(record)}
      >
        <Button danger icon={<DeleteOutlined />} />
      </Popconfirm>
    </div>
  </div>
);

// =====================================================================
// Worker detail drawer — profile + salary summary + daily work history
// =====================================================================
const WorkerDetailDrawer = ({ open, workerId, onClose }) => {
  const dispatch = useDispatch();
  const {
    selectedWorker,
    summary,
    recentWork,
    recentWorkPagination,
    detail_status,
  } = useSelector((state) => state.employer || {});

  const loading = detail_status === "loading";
  const { page = 1, limit = 10, total = 0 } = recentWorkPagination || {};

  useEffect(() => {
    if (open && workerId) {
      dispatch(getSingleEmployerAsync({ id: workerId, page: 1, limit: 10 }));
    }
    if (!open) dispatch(clearSelectedWorker());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workerId]);

  const handlePageChange = (p) => {
    dispatch(getSingleEmployerAsync({ id: workerId, page: p, limit }));
  };

  const workColumns = [
    { title: "Date", dataIndex: "entryDate", key: "entryDate", width: 110 },
    {
      title: "Site",
      dataIndex: "currentSite",
      key: "currentSite",
      render: (v) => v || "—",
    },
    {
      title: "Attendance",
      dataIndex: "attendance",
      key: "attendance",
      render: (v) => (
        <Tag color={ATTENDANCE_LABEL[v]?.color || "default"}>
          {ATTENDANCE_LABEL[v]?.label || v}
        </Tag>
      ),
    },
    {
      title: "Work Under",
      dataIndex: "workUnder",
      key: "workUnder",
      render: (v) => (
        <Tag color={UNDER_WORK_LABEL[v]?.color || "default"}>
          {UNDER_WORK_LABEL[v]?.label || v}
        </Tag>
      ),
    },
    {
      title: "Work Status",
      dataIndex: "workStatus",
      key: "workStatus",
      render: (v) => (
        <Tag color={WORK_STATUS_LABEL[v]?.color || "default"}>
          {WORK_STATUS_LABEL[v]?.label || v}
        </Tag>
      ),
    },
    { title: "Salary", dataIndex: "salary", key: "salary", render: money },
    {
      title: "Overtime",
      key: "overtime",
      render: (_, r) =>
        `${r.overtimeHours || 0} hrs (${money(r.overtimeAmount)})`,
    },
    {
      title: "Advance",
      dataIndex: "advanceAmount",
      key: "advanceAmount",
      render: money,
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        selectedWorker
          ? `${selectedWorker.name} — Worker Detail`
          : "Worker Detail"
      }
      width={720}
      className="wm-drawer"
      destroyOnClose
    >
      <Spin spinning={loading}>
        {selectedWorker && (
          <>
            <div className="wm-drawer-header">
              <Avatar
                size={56}
                icon={<UserOutlined />}
                className="wm-avatar wm-avatar-lg"
              />
              <div>
                <h3>{selectedWorker.name}</h3>
                <span className="wm-drawer-workerid">
                  {selectedWorker.workerId}
                </span>
              </div>
              <Tag
                color={
                  selectedWorker.status === "active" ? "success" : "default"
                }
                className="wm-drawer-status"
              >
                {statusLabel(STATUS_OPTIONS, selectedWorker.status)}
              </Tag>
            </div>

            <Descriptions
              column={{ xs: 1, sm: 2 }}
              size="small"
              bordered
              className="wm-drawer-descriptions"
            >
              <Descriptions.Item label="Designation">
                {statusLabel(DESIGNATION_OPTIONS, selectedWorker.designation)}
              </Descriptions.Item>
              <Descriptions.Item label="Base Salary">
                {money(selectedWorker.salary)}
              </Descriptions.Item>
              <Descriptions.Item label="Entry Date">
                {selectedWorker.entryDate || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {fmtDate(selectedWorker.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedWorker.description || "—"}
              </Descriptions.Item>
            </Descriptions>

            {summary &&
              typeof summary === "object" &&
              Object.keys(summary).length > 0 && (
                <div className="wm-summary-block">
                  <div className="wm-section-title">Salary Summary</div>
                  <Row gutter={[12, 12]}>
                    {Object.entries(summary).map(([key, value]) => {
                      if (value !== null && typeof value === "object")
                        return null;
                      return (
                        <Col xs={12} sm={8} key={key}>
                          <div className="wm-stat-card">
                            <Statistic
                              title={humanizeKey(key)}
                              value={
                                isMoneyKey(key) && typeof value === "number"
                                  ? value
                                  : (value ?? "—")
                              }
                              prefix={
                                isMoneyKey(key) && typeof value === "number"
                                  ? "Rs."
                                  : undefined
                              }
                            />
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}

            <div className="wm-section-title wm-recent-title">
              Daily Work History
            </div>
            <Table
              rowKey="_id"
              size="small"
              columns={workColumns}
              dataSource={recentWork}
              pagination={false}
              scroll={{ x: 700 }}
              locale={{
                emptyText: <Empty description="No daily work entries yet" />,
              }}
            />
            {total > limit && (
              <div className="wm-recent-pagination">
                <Pagination
                  simple
                  current={page}
                  pageSize={limit}
                  total={total}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </Spin>
    </Drawer>
  );
};

// =====================================================================
// Main page — master worker profiles
// =====================================================================
const WorkerManagement = () => {
  const dispatch = useDispatch();

  const employerState = useSelector((state) => state.employer || {});
  const {
    workers = [],
    pagination = {},
    get_status,
    get_error: error,
  } = employerState;
  const { total = 0 } = pagination;

  const loading = get_status === "loading";

  // ---------- filters & pagination ----------
  const [search, setSearch] = useState("");
  const [designation, setDesignation] = useState(undefined);
  const [status, setStatus] = useState(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const searchDebounceRef = useRef(null);

  // ---------- modals / drawer ----------
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewWorkerId, setViewWorkerId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();

  const buildParams = useCallback(
    (overrides = {}) => {
      const params = {
        search: search || undefined,
        page,
        limit: pageSize,
        ...overrides,
      };
      Object.keys(params).forEach(
        (k) => params[k] === undefined && delete params[k],
      );
      return params;
    },
    [search, page, pageSize],
  );

  const fetchList = useCallback(
    (overrides = {}) => dispatch(getEmployersAsync(buildParams(overrides))),
    [dispatch, buildParams],
  );

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // designation is client-side only — backend search doesn't take a
  // separate designation filter, so we filter the fetched page locally.
  const visibleWorkers = useMemo(
    () =>
      designation
        ? workers.filter((w) => w.designation === designation)
        : workers,
    [workers, designation],
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      dispatch(
        getEmployersAsync(buildParams({ search: value || undefined, page: 1 })),
      );
    }, 400);
  };

  const resetFilters = () => {
    setSearch("");
    setDesignation(undefined);
    setStatus(undefined);
    setPage(1);
  };

  // ---------- add / edit ----------
  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      entryDate: record.entryDate
        ? dayjs(record.entryDate, "DD/MM/YYYY")
        : null,
    });
    setFormOpen(true);
  };

  const closeFormModal = () => {
    setFormOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...values,
        entryDate: values.entryDate
          ? values.entryDate.format("DD/MM/YYYY")
          : undefined,
      };

      if (editingRecord) {
        await dispatch(
          updateEmployerAsync({ id: editingRecord._id, ...payload }),
        ).unwrap();
      } else {
        await dispatch(createEmployerAsync(payload)).unwrap();
      }
      closeFormModal();
      fetchList();
    } catch (err) {
      // validation errors show inline; thunk rejections surface via `error` selector
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    setDeletingId(record._id);
    try {
      await dispatch(deleteEmployerAsync(record._id)).unwrap();
      fetchList();
    } finally {
      setDeletingId(null);
    }
  };

  // ---------- table columns ----------
  const columns = useMemo(
    () => [
      {
        title: "Worker",
        dataIndex: "name",
        key: "name",
        fixed: "left",
        width: 200,
        render: (v, r) => (
          <div className="wm-name-cell">
            <Avatar size={32} icon={<UserOutlined />} className="wm-avatar" />
            <div>
              <div className="wm-name-cell-name">{v}</div>
              <div className="wm-name-cell-id">{r.workerId}</div>
            </div>
          </div>
        ),
      },
      {
        title: "Designation",
        dataIndex: "designation",
        key: "designation",
        width: 110,
        render: (v) => statusLabel(DESIGNATION_OPTIONS, v),
      },
      {
        title: "Base Salary",
        dataIndex: "salary",
        key: "salary",
        width: 120,
        render: money,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (v) => (
          <Tag color={v === "active" ? "success" : "default"}>
            {statusLabel(STATUS_OPTIONS, v)}
          </Tag>
        ),
      },
      {
        title: "Entry Date",
        dataIndex: "entryDate",
        key: "entryDate",
        width: 120,
        render: (v) => v || "—",
      },
      {
        title: "Created",
        dataIndex: "created_at",
        key: "created_at",
        width: 150,
        responsive: ["xl"],
        render: fmtDate,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 140,
        render: (_, record) => (
          <div className="wm-actions-cell">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setViewWorkerId(record._id)}
            />
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
            <Popconfirm
              title="Delete this worker?"
              description={`Remove ${record.name} permanently?`}
              okText="Delete"
              okButtonProps={{
                danger: true,
                loading: deletingId === record._id,
              }}
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
    <div className="wm-root">
      <div className="wm-header">
        <div className="wm-header-top">
          <div>
            <Title level={3} className="wm-title">
              Worker Management
            </Title>
            <span className="wm-subtitle">
              Master profiles — daily attendance & pay live on each worker's
              detail view
            </span>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="wm-add-btn"
          onClick={openAddModal}
        >
          Add Worker
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={typeof error === "string" ? error : "Something went wrong"}
          className="wm-error-alert"
        />
      )}

      <div className="wm-filters-card">
        <div className="wm-filters">
          <div className="wm-filters-row">
            <Input
              allowClear
              className="wm-search"
              placeholder="Search by name or worker ID…"
              prefix={<SearchOutlined />}
              value={search}
              onChange={handleSearchChange}
            />
            <Select
              allowClear
              className="wm-filter-select"
              placeholder="Designation"
              options={DESIGNATION_OPTIONS}
              value={designation}
              onChange={setDesignation}
            />
            <Select
              allowClear
              className="wm-filter-select"
              placeholder="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            />
          </div>
          <div className="wm-filters-footer">
            <Button
              type="link"
              className="wm-reset-btn"
              icon={<ReloadOutlined />}
              onClick={resetFilters}
            >
              Reset filters
            </Button>
            <span className="wm-result-count">{total} worker(s)</span>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* ---- Mobile card list ---- */}
        <div className="wm-card-list">
          {visibleWorkers.length === 0 && !loading ? (
            <Empty description="No workers found" />
          ) : (
            visibleWorkers.map((record) => (
              <WorkerCard
                key={record._id}
                record={record}
                onView={(r) => setViewWorkerId(r._id)}
                onEdit={openEditModal}
                onDelete={handleDelete}
                deleting={deletingId === record._id}
              />
            ))
          )}
          {visibleWorkers.length > 0 && (
            <div className="wm-pagination-mobile">
              <Pagination
                simple
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={setPage}
              />
            </div>
          )}
        </div>

        {/* ---- Tablet / laptop / desktop table ---- */}
        <div className="wm-table-wrap">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={visibleWorkers}
            scroll={{ x: 1000 }}
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
        </div>
      </Spin>

      {/* =================== DETAIL DRAWER =================== */}
      <WorkerDetailDrawer
        open={!!viewWorkerId}
        workerId={viewWorkerId}
        onClose={() => setViewWorkerId(null)}
      />

      {/* =================== ADD / EDIT MODAL =================== */}
      <Modal
        open={formOpen}
        onCancel={closeFormModal}
        title={editingRecord ? "Edit Worker" : "Add Worker"}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="wm-form-grid">
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Name is required" }]}
            >
              <Input placeholder="e.g. Ali" />
            </Form.Item>
            <Form.Item
              label="Designation"
              name="designation"
              rules={[{ required: true, message: "Select a designation" }]}
            >
              <Select options={DESIGNATION_OPTIONS} placeholder="Select" />
            </Form.Item>
            <Form.Item
              label="Base Salary"
              name="salary"
              rules={[{ required: true, message: "Salary is required" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
            {editingRecord && (
              <Form.Item label="Status" name="status">
                <Select options={STATUS_OPTIONS} placeholder="Select" />
              </Form.Item>
            )}
            <Form.Item
              label="Entry Date"
              name="entryDate"
              tooltip="Khali chhodein to aaj ki date automatic save ho jayegi"
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                placeholder="DD/MM/YYYY (optional)"
                allowClear
              />
            </Form.Item>
          </div>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional notes…" />
          </Form.Item>
          <Form.Item className="wm-form-actions">
            <Button type="primary" htmlType="submit" loading={submitting} block>
              {editingRecord ? "Save changes" : "Create worker"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkerManagement;
