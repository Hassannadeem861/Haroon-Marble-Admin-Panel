import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  Form,
  InputNumber,
  Popconfirm,
  Typography,
  Alert,
  Pagination,
  Descriptions,
  Empty,
  Spin,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getEmployersAsync,
  createEmployerAsync,
  updateEmployerAsync,
  deleteEmployerAsync,
} from "../store/services/employerService";
import "./Agents.css";

const { Title } = Typography;
// const { RangePicker } = DatePicker;

// ---- static option lists (mirrors the Mongoose enum values) ----
const DESIGNATION_OPTIONS = [
  { value: "mazdoor", label: "Mazdoor" },
  { value: "qarigar", label: "Qarigar" },
];

const WORK_UNDER_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "partnerShip", label: "Partnership" },
  { value: "client", label: "Client" },
];

const WORK_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "complete", label: "Complete" },
];

const ATTENDANCE_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
];

const STATUS_COLOR = {
  pending: "warning",
  inprogress: "processing",
  complete: "success",
};

const ATTENDANCE_COLOR = {
  present: "success",
  absent: "error",
};

const fmtDate = (d) => (d ? dayjs(d).format("DD MMM YYYY, hh:mm A") : "—");
const fmtDateShort = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—");

const statusLabel = (opts, val) =>
  opts.find((o) => o.value === val)?.label || val || "—";

// =====================================================================
// Mobile card — one employer record
// =====================================================================
const EmployerCard = ({ record, onView, onEdit, onDelete, deleting }) => (
  <div className={`emp-card emp-card--${record.workStatus || "pending"}`}>
    <div className="emp-card-top">
      <div>
        <div className="emp-card-name">{record.name}</div>
        <div className="emp-card-tags">
          <Tag color={STATUS_COLOR[record.workStatus] || "default"}>
            {statusLabel(WORK_STATUS_OPTIONS, record.workStatus)}
          </Tag>
          <Tag color={ATTENDANCE_COLOR[record.attendence] || "default"}>
            {statusLabel(ATTENDANCE_OPTIONS, record.attendence)}
          </Tag>
        </div>
      </div>
    </div>

    <div className="emp-card-grid">
      <div>
        <div className="emp-card-field-label">Designation</div>
        <div className="emp-card-field-value">
          {statusLabel(DESIGNATION_OPTIONS, record.designation)}
        </div>
      </div>
      <div>
        <div className="emp-card-field-label">Work Under</div>
        <div className="emp-card-field-value">
          {statusLabel(WORK_UNDER_OPTIONS, record.workUnder)}
        </div>
      </div>
      <div>
        <div className="emp-card-field-label">Site</div>
        <div className="emp-card-field-value">{record.currentSite || "—"}</div>
      </div>
      <div>
        <div className="emp-card-field-label">Salary</div>
        <div className="emp-card-field-value">
          {record.salary != null ? `Rs. ${record.salary}` : "—"}
        </div>
      </div>
      <div>
        <div className="emp-card-field-label">Advance</div>
        <div className="emp-card-field-value">
          {record.advanced != null ? `Rs. ${record.advanced}` : "—"}
        </div>
      </div>
      <div>
        <div className="emp-card-field-label">Overtime</div>
        <div className="emp-card-field-value">{record.overTime ?? "—"}</div>
      </div>
    </div>

    <div className="emp-card-dates">
      Created {fmtDateShort(record.created_at)}
      {/* · Updated{" "}
      {fmtDateShort(record.updated_at)} */}
    </div>

    <div className="emp-card-actions">
      <Button icon={<EyeOutlined />} onClick={() => onView(record)}>
        View
      </Button>
      <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
        Edit
      </Button>
      <Popconfirm
        title="Delete this record?"
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
// Main page
// =====================================================================
const EmployerManagement = () => {
  const dispatch = useDispatch();

  const employerState = useSelector((state) => state.employer || {});
  const {
    employers = [],
    pagination = {},
    get_status,
    get_error: error,
  } = employerState;

  const { total = 0, page: storePage = 1, totalPages = 1 } = pagination;

  const loading = get_status === "loading";

  // ---------- filters & pagination ----------
  const [search, setSearch] = useState("");
  const [designation, setDesignation] = useState(undefined);
  const [workUnder, setWorkUnder] = useState(undefined);
  const [workStatus, setWorkStatus] = useState(undefined);
  const [attendence, setAttendence] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterDate, setFilterDate] = useState(null);
  const searchDebounceRef = useRef(null);

  // ---------- modals ----------
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();

  const buildParams = useCallback(
    (overrides = {}) => {
      const searchValue =
        search ||
        designation ||
        workUnder ||
        workStatus ||
        attendence ||
        undefined;

      const params = {
        search: searchValue,
        page,
        limit: pageSize,
        ...overrides,
      };
      if (filterDate) {
        params.startDate = filterDate.startOf("day").toISOString();
        params.endDate = filterDate.endOf("day").toISOString();
      }
      Object.keys(params).forEach(
        (k) => params[k] === undefined && delete params[k],
      );
      return params;
    },
    [
      search,
      designation,
      workUnder,
      workStatus,
      attendence,
      filterDate,
      page,
      pageSize,
    ],
  );

  const fetchList = useCallback(
    (overrides = {}) => {
      dispatch(getEmployersAsync(buildParams(overrides)));
    },
    [dispatch, buildParams],
  );

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    designation,
    workUnder,
    workStatus,
    attendence,
    filterDate,
    page,
    pageSize,
  ]);

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
    setWorkUnder(undefined);
    setWorkStatus(undefined);
    setAttendence(undefined);
    setFilterDate(null);
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
    form.setFieldsValue(record);
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
      if (editingRecord) {
        await dispatch(
          updateEmployerAsync({ id: editingRecord._id, ...values }),
        ).unwrap();
      } else {
        await dispatch(createEmployerAsync(values)).unwrap();
      }
      closeFormModal();
      fetchList();
    } catch (err) {
      // validation errors are shown inline by the form itself;
      // thunk rejections surface via the `error` selector below
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

  // ---------- table columns (tablet / laptop / desktop) ----------
  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        fixed: "left",
        width: 140,
        render: (v) => <span className="emp-name-cell">{v}</span>,
      },
      {
        title: "Designation",
        dataIndex: "designation",
        key: "designation",
        width: 110,
        render: (v) => statusLabel(DESIGNATION_OPTIONS, v),
      },
      {
        title: "Work Under",
        dataIndex: "workUnder",
        key: "workUnder",
        width: 120,
        responsive: ["lg"],
        render: (v) => statusLabel(WORK_UNDER_OPTIONS, v),
      },
      {
        title: "Site",
        dataIndex: "currentSite",
        key: "currentSite",
        width: 140,
        responsive: ["lg"],
        render: (v) => v || "—",
      },
      {
        title: "Salary",
        dataIndex: "salary",
        key: "salary",
        width: 100,
        render: (v) => (v != null ? `Rs. ${v}` : "—"),
      },
      {
        title: "Advance",
        dataIndex: "advanced",
        key: "advanced",
        width: 100,
        responsive: ["xl"],
        render: (v) => (v != null ? `Rs. ${v}` : "—"),
      },
      {
        title: "Overtime",
        dataIndex: "overTime",
        key: "overTime",
        width: 90,
        responsive: ["xl"],
      },
      {
        title: "Status",
        dataIndex: "workStatus",
        key: "workStatus",
        width: 120,
        render: (v) => (
          <Tag color={STATUS_COLOR[v] || "default"}>
            {statusLabel(WORK_STATUS_OPTIONS, v)}
          </Tag>
        ),
      },
      {
        title: "Attendance",
        dataIndex: "attendence",
        key: "attendence",
        width: 110,
        render: (v) => (
          <Tag color={ATTENDANCE_COLOR[v] || "default"}>
            {statusLabel(ATTENDANCE_OPTIONS, v)}
          </Tag>
        ),
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
        title: "Updated",
        dataIndex: "updated_at",
        key: "updated_at",
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
          <div className="emp-actions-cell">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setViewRecord(record)}
            />
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
            <Popconfirm
              title="Delete this record?"
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
    <div className="emp-root">
      <div className="emp-header">
        <div className="emp-header-top">
          <div>
            <Title level={3} className="emp-title">
              Employer Management
            </Title>
            <span className="emp-subtitle">
              Track workers, sites, pay and attendance in one place
            </span>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="emp-add-btn"
          onClick={openAddModal}
        >
          Add Employer
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={typeof error === "string" ? error : "Something went wrong"}
          className="emp-error-alert"
        />
      )}

      <div className="emp-filters-card">
        <div className="emp-filters">
          <div className="emp-filters-row">
            <Input
              allowClear
              className="emp-search"
              placeholder="Search by name…"
              prefix={<SearchOutlined />}
              value={search}
              onChange={handleSearchChange}
            />
            <Select
              allowClear
              className="emp-filter-select"
              placeholder="Designation"
              options={DESIGNATION_OPTIONS}
              value={designation}
              onChange={(v) => {
                setDesignation(v);
                setPage(1);
              }}
            />
            <Select
              allowClear
              className="emp-filter-select"
              placeholder="Work Under"
              options={WORK_UNDER_OPTIONS}
              value={workUnder}
              onChange={(v) => {
                setWorkUnder(v);
                setPage(1);
              }}
            />
            <Select
              allowClear
              className="emp-filter-select"
              placeholder="Work Status"
              options={WORK_STATUS_OPTIONS}
              value={workStatus}
              onChange={(v) => {
                setWorkStatus(v);
                setPage(1);
              }}
            />
            <Select
              allowClear
              className="emp-filter-select"
              placeholder="Attendance"
              options={ATTENDANCE_OPTIONS}
              value={attendence}
              onChange={(v) => {
                setAttendence(v);
                setPage(1);
              }}
            />
            <DatePicker
              className="emp-date-range"
              value={filterDate}
              onChange={(v) => {
                setFilterDate(v);
                setPage(1);
              }}
              placeholder="Filter by date"
              format="DD MMM YYYY"
              allowClear
            />
          </div>
          <div className="emp-filters-footer">
            <Button
              type="link"
              className="emp-reset-btn"
              icon={<ReloadOutlined />}
              onClick={resetFilters}
            >
              Reset filters
            </Button>
            <span className="emp-result-count">{total} record(s)</span>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        
        {/* ---- Mobile card list ---- */}
        <div className="emp-card-list">
          {employers.length === 0 && !loading ? (
            <Empty description="No employers found" />
          ) : (
            employers.map((record) => (
              <EmployerCard
                key={record._id}
                record={record}
                onView={setViewRecord}
                onEdit={openEditModal}
                onDelete={handleDelete}
                deleting={deletingId === record._id}
              />
            ))
          )}
          {employers.length > 0 && (
            <div className="emp-pagination-mobile">
              <Pagination
                simple
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>

        {/* ---- Tablet / laptop / desktop table ---- */}
        <div className="emp-table-wrap">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={employers}
            scroll={{ x: 1100 }}
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

      {/* =================== VIEW MODAL =================== */}
      <Modal
        open={!!viewRecord}
        onCancel={() => setViewRecord(null)}
        footer={null}
        title={null}
        width={520}
      >
        {viewRecord && (
          <>
            <div className="emp-view-header">
              <div>
                <div className="emp-view-title">Employer details</div>
                <h4>{viewRecord.name}</h4>
              </div>
              <Tag color={STATUS_COLOR[viewRecord.workStatus] || "default"}>
                {statusLabel(WORK_STATUS_OPTIONS, viewRecord.workStatus)}
              </Tag>
            </div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Description">
                {viewRecord.description || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Designation">
                {statusLabel(DESIGNATION_OPTIONS, viewRecord.designation)}
              </Descriptions.Item>
              <Descriptions.Item label="Work Under">
                {statusLabel(WORK_UNDER_OPTIONS, viewRecord.workUnder)}
              </Descriptions.Item>
              <Descriptions.Item label="Current Site">
                {viewRecord.currentSite || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Salary">
                {viewRecord.salary != null ? `Rs. ${viewRecord.salary}` : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Advance">
                {viewRecord.advanced != null
                  ? `Rs. ${viewRecord.advanced}`
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Overtime (hrs)">
                {viewRecord.overTime ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Attendance">
                <Tag
                  color={ATTENDANCE_COLOR[viewRecord.attendence] || "default"}
                >
                  {statusLabel(ATTENDANCE_OPTIONS, viewRecord.attendence)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {fmtDate(viewRecord.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {fmtDate(viewRecord.updated_at)}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      {/* =================== ADD / EDIT MODAL =================== */}
      <Modal
        open={formOpen}
        onCancel={closeFormModal}
        title={editingRecord ? "Edit Employer" : "Add Employer"}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="emp-form-grid">
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
              label="Work Under"
              name="workUnder"
              rules={[{ required: true, message: "Select work under" }]}
            >
              <Select options={WORK_UNDER_OPTIONS} placeholder="Select" />
            </Form.Item>
            <Form.Item label="Current Site" name="currentSite">
              <Input placeholder="e.g. DHA Phase 8" />
            </Form.Item>
            <Form.Item
              label="Salary"
              name="salary"
              rules={[{ required: true, message: "Salary is required" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
            <Form.Item label="Advance" name="advanced">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
            <Form.Item label="Overtime (hrs)" name="overTime">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
            <Form.Item label="Work Status" name="workStatus">
              <Select options={WORK_STATUS_OPTIONS} placeholder="Select" />
            </Form.Item>
            <Form.Item label="Attendance" name="attendence">
              <Select options={ATTENDANCE_OPTIONS} placeholder="Select" />
            </Form.Item>
          </div>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional notes…" />
          </Form.Item>
          <Form.Item className="emp-form-actions">
            <Button type="primary" htmlType="submit" loading={submitting} block>
              {editingRecord ? "Save changes" : "Create employer"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployerManagement;
