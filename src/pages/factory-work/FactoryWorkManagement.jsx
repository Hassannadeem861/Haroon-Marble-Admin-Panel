import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Tag,
  Input,
  Select,
  Button,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Popconfirm,
  Typography,
  Alert,
  Pagination,
  Empty,
  Spin,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getFactoryWorksAsync,
  createFactoryWorkAsync,
  deleteFactoryWorkAsync,
  updateFactoryWorkAsync,
} from "../../store/services/factoryWorkService.js";
import "./FactoryWork.css";
import { getErrorMessage } from "../../utils/toastError.js";
import toast from "react-hot-toast";

const { Title } = Typography;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  //   { value: "in_factory", label: "In Factory" },
  //   { value: "ready", label: "Ready" },
  //   { value: "on_the_way", label: "On the Way" },
  { value: "received", label: "Received" },
  { value: "checked", label: "Checked" },
  //   { value: "completed", label: "Completed" },
];

const STATUS_COLOR = {
  pending: "default",
  in_factory: "blue",
  ready: "cyan",
  on_the_way: "processing",
  received: "purple",
  checked: "geekblue",
  completed: "success",
};

const PAYMENT_COLOR = {
  unpaid: "error",
  partially_paid: "warning",
  fully_paid: "success",
};

const statusLabel = (val) =>
  STATUS_OPTIONS.find((o) => o.value === val)?.label || val || "—";
const rs = (v) => (v != null ? `Rs. ${Number(v).toLocaleString()}` : "—");
const fmtDate = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—");

// =====================================================================
// Mobile card
// =====================================================================
const WorkCard = ({ record, onView, onEdit, onDelete, deleting }) => (
  <div className="fw-card">
    <div className="fw-card-top">
      <div>
        <div className="fw-card-name">{record.factoryName}</div>
      </div>
      <Tag color={STATUS_COLOR[record.status] || "default"}>
        {statusLabel(record.status)}
      </Tag>
    </div>

    <div className="fw-card-grid">
      <div>
        <div className="fw-field-label">Material Name</div>
        <div className="fw-card-value">{record.workMaterialName || "—"}</div>
      </div>
      <div>
        <div className="fw-field-label">Material Quantity</div>
        <div className="fw-card-value">{record.quantity || "—"}</div>
      </div>
      <div>
        <div className="fw-field-label">Total Amount</div>
        <div className="fw-field-value">{rs(record.totalAmount)}</div>
      </div>
      <div>
        <div className="fw-field-label">Advance Amount</div>
        <div className="fw-field-value">{rs(record.totalPaid)}</div>
      </div>
      <div>
        <div className="fw-field-label">Remaining Amount</div>
        <div className="fw-field-value fw-remaining">
          {rs(record.remainingAmount)}
        </div>
      </div>
      <div>
        <div className="fw-field-label">Payment</div>
        <Tag color={PAYMENT_COLOR[record.paymentStatus] || "default"}>
          {record.paymentStatus?.replace("_", " ") || "—"}
        </Tag>
      </div>
      <div>
        <div className="fw-field-label">Completion Date</div>
        <div className="fw-field-value">{fmtDate(record.expectedCompletionDate)}</div>
      </div>
    </div>

    <div className="fw-card-actions">
      <Button icon={<EyeOutlined />} onClick={() => onView(record)} block>
        View Details
      </Button>
      <Button
        // size="small"
        icon={<EditOutlined />}
        onClick={() => onEdit(record)}
      >
        Edit
      </Button>
      <Popconfirm
        title="Delete this record?"
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
const FactoryWorkManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    factoryWorks = [],
    pagination = {},
    get_status,
    get_error,
  } = useSelector((state) => state.factoryWork || {});

  const { total = 0 } = pagination;
  const loading = get_status === "loading";

  const shownErrorRef = useRef(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();

  const buildParams = useCallback(
    (overrides = {}) => {
      const params = {
        search: search || undefined,
        status,
        page,
        limit: pageSize,
        ...overrides,
      };
      Object.keys(params).forEach(
        (k) => params[k] === undefined && delete params[k],
      );
      return params;
    },
    [search, status, page, pageSize],
  );

  const fetchList = useCallback(
    (overrides = {}) => dispatch(getFactoryWorksAsync(buildParams(overrides))),
    [dispatch, buildParams],
  );

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, pageSize]);

  useEffect(() => {
    if (get_error && get_error !== shownErrorRef.current) {
      toast.error(get_error);
      shownErrorRef.current = get_error;
    }
  }, [get_error]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
    fetchList({ search: value || undefined, page: 1 });
  };

  const resetFilters = () => {
    setSearch("");
    setStatus(undefined);
    setPage(1);
  };

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setFormOpen(true);
  };

  const closeFormModal = () => {
    setFormOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const openEditModal = (record) => {
    console.log("openEditModel: ", record);
    setEditingRecord(record);

    const advancePayment = record.payments?.find((p) => p.type === "advance");
    let advanceAmount = advancePayment?.amount || 0;

    // Advance date bhi nikal lo
    const advanceDate = advancePayment?.date
      ? dayjs(advancePayment.date)
      : null;

    form.setFieldsValue({
      factoryName: record.factoryName,
      workMaterialName: record.workMaterialName,
      quantity: record.quantity,
      totalAmount: record.totalAmount,
      advanceAmount: advanceAmount,
      advanceDate: advanceDate,

      expectedCompletionDate: record.expectedCompletionDate
        ? dayjs(record.expectedCompletionDate)
        : null,
      notes: record.notes,
    });
    setFormOpen(true);
  };

  // ---------- Add / Edit submit ----------
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        ...values,
        advanceDate: values.advanceDate
          ? values.advanceDate.format("YYYY-MM-DD")
          : undefined,
        expectedCompletionDate: values.expectedCompletionDate
          ? values.expectedCompletionDate.format("YYYY-MM-DD")
          : undefined,
      };

      if (editingRecord) {
        await dispatch(
          updateFactoryWorkAsync({ workId: editingRecord._id, ...payload }),
        ).unwrap();
        toast.success("Factory work updated successfully.");
      } else {
        await dispatch(createFactoryWorkAsync(payload)).unwrap();
        toast.success("Factory work created successfully.");
      }

      closeFormModal();
      fetchList();
    } catch (err) {
      const message = getErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    setDeletingId(record._id);
    try {
      await dispatch(deleteFactoryWorkAsync(record._id)).unwrap();
      toast.success("Factory work deleted successfully.");
      fetchList();
    } catch {
      toast.error(getErrorMessage(err) || "Failed to delete factory work.");
    } finally {
      setDeletingId(null);
    }
  };

  const goToDetail = (record) => navigate(`/factory-work/${record._id}`);

  const columns = useMemo(
    () => [
      {
        title: "Factory",
        dataIndex: "factoryName",
        key: "factoryName",
        fixed: "left",
        width: 160,
      },
      {
        title: "Material",
        dataIndex: "workMaterialName",
        key: "workMaterialName",
        width: 140,
      },
      {
        title: "Quantity",
        dataIndex: "quantity",
        key: "quantity",
        width: 110,
        responsive: ["lg"],
      },
      {
        title: "Total Amount",
        dataIndex: "totalAmount",
        key: "totalAmount",
        width: 110,
        render: rs,
      },
      {
        title: "Paid Amount",
        dataIndex: "totalPaid",
        key: "totalPaid",
        width: 110,
        render: rs,
      },
      {
        title: "Remaining Amount",
        dataIndex: "remainingAmount",
        key: "remainingAmount",
        width: 120,
        render: (v) => <span className="fw-remaining">{rs(v)}</span>,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (v) => (
          <Tag color={STATUS_COLOR[v] || "default"}>{statusLabel(v)}</Tag>
        ),
      },
      {
        title: "Payment",
        dataIndex: "paymentStatus",
        key: "paymentStatus",
        width: 130,
        responsive: ["xl"],
        render: (v) => (
          <Tag color={PAYMENT_COLOR[v] || "default"}>
            {v?.replace("_", " ") || "—"}
          </Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 100,
        render: (_, record) => (
          <div className="fw-actions-cell">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => goToDetail(record)}
            />
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
            {/* 🆕 */}
            <Popconfirm
              title="Delete this record?"
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
    <div className="fw-root">
      <div className="fw-header">
        <div>
          <Title level={3} className="fw-title">
            Factory Work
          </Title>
          <span className="fw-subtitle">
            Track factory orders, payments, and material movement
          </span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Factory Work
        </Button>
      </div>

      {get_error && (
        <Alert
          type="error"
          showIcon
          message={get_error}
          className="fw-error-alert"
        />
      )}

      <div className="fw-filters-card">
        <div className="fw-filters-row">
          <Input
            allowClear
            className="fw-search"
            placeholder="Search by factory or material…"
            prefix={<SearchOutlined />}
            value={search}
            onChange={handleSearch}
          />
          <Select
            allowClear
            className="fw-filter-select"
            placeholder="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          <Button type="link" icon={<ReloadOutlined />} onClick={resetFilters}>
            Reset
          </Button>
        </div>
        <span className="fw-result-count">{total} record(s)</span>
      </div>

      <Spin spinning={loading}>
        <div className="fw-card-list">
          {factoryWorks.length === 0 && !loading ? (
            <Empty description="No factory work found" />
          ) : (
            factoryWorks.map((record) => (
              <WorkCard
                key={record._id}
                record={record}
                onView={goToDetail}
                onEdit={openEditModal}
                onDelete={handleDelete}
                deleting={deletingId === record._id}
              />
            ))
          )}
          {factoryWorks.length > 0 && (
            <div className="fw-pagination-mobile">
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

        <div className="fw-table-wrap">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={factoryWorks}
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

      <Modal
        open={formOpen}
        onCancel={closeFormModal}
        title={editingRecord ? "Edit Factory Work" : "Add Factory Work"} // 🆕
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="fw-form-grid">
            <Form.Item
              label="Factory Name"
              name="factoryName"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. ABC Marble Factory" />
            </Form.Item>
            <Form.Item
              label="Work / Material Name"
              name="workMaterialName"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. Marble" />
            </Form.Item>
            <Form.Item
              label="Quantity"
              name="quantity"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. 1000 sq.ft" />
            </Form.Item>
            <Form.Item
              label="Total Amount"
              name="totalAmount"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>

            {/* 🆕 Advance fields sirf CREATE mode mein dikhao — edit mein "Add Payment" se hota hai */}
            {/* {!editingRecord && ( */}
            <>
              <Form.Item label="Advance Amount" name="advanceAmount">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="0"
                />
              </Form.Item>
              <Form.Item label="Advance Date" name="advanceDate">
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
              </Form.Item>
            </>
            {/* )} */}

            <Form.Item
              label="Work Completion Date"
              name="expectedCompletionDate"
            >
              <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
            </Form.Item>
          </div>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Optional notes…" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              {editingRecord ? "Save Changes" : "Create Factory Work"}{" "}
              {/* 🆕 */}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FactoryWorkManagement;
