import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Tabs,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getSitesAsync,
  getSingleSiteAsync,
  createSiteAsync,
  updateSiteAsync,
  deleteSiteAsync,
} from "../store/services/siteService";
import {
  createSiteExpenseAsync,
  updateSiteExpenseAsync,
  deleteSiteExpenseAsync,
} from "../store/services/siteExpenseService";
import {
  createSiteMaterialAsync,
  updateSiteMaterialAsync,
  deleteSiteMaterialAsync,
} from "../store/services/siteMaterialService";
import { clearSelectedSite } from "../store/slices/siteSlice";
import "./SiteManagement.css";

const { Title } = Typography;

// ---- static option lists (mirrors the Mongoose enum values) ----
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

const STATUS_TAG = {
  active: { label: "Active", color: "success" },
  completed: { label: "Completed", color: "default" },
  on_hold: { label: "On Hold", color: "warning" },
};

const CATEGORY_OPTIONS = [
  { value: "labor", label: "Labor" },
  { value: "transport", label: "Transport" },
  // { value: "material", label: "Material" },
  { value: "misc", label: "Chai ya fresh juice" },
  { value: "other", label: "Other" },
];

const BROUGHT_BY_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "company", label: "Company" },
  // { value: "vendor", label: "Vendor" },
];

const fmtDate = (d) => (d ? dayjs(d).format("DD MMM YYYY, hh:mm A") : "—");
const money = (v) =>
  v !== undefined && v !== null && v !== "" ? `Rs. ${Number(v).toLocaleString()}` : "—";

const statusLabel = (opts, val) => opts.find((o) => o.value === val)?.label || val || "—";

const humanizeKey = (key) =>
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const isCountKey = (key) => /count$/i.test(key);
const isMoneyKey = (key) => !isCountKey(key) && /expense|value|amount|cost|total/i.test(key);

// =====================================================================
// Mobile card — one site (master profile)
// =====================================================================
const SiteCard = ({ record, onView, onEdit, onDelete, deleting }) => (
  <div className={`sm-card sm-card--${record.status || "active"}`}>
    <div className="sm-card-top">
      <Avatar size={40} icon={<EnvironmentOutlined />} className="sm-avatar" />
      <div className="sm-card-top-info">
        <div className="sm-card-name">{record.name}</div>
        <div className="sm-card-location">{record.location || "No location set"}</div>
      </div>
      <Tag color={STATUS_TAG[record.status]?.color || "default"}>
        {STATUS_TAG[record.status]?.label || record.status}
      </Tag>
    </div>

    <div className="sm-card-grid">
      <div>
        <div className="sm-card-field-label">Owner</div>
        <div className="sm-card-field-value">{record.ownerName || "—"}</div>
      </div>
      <div>
        <div className="sm-card-field-label">Start Date</div>
        <div className="sm-card-field-value">{record.startDate || "—"}</div>
      </div>
    </div>

    <div className="sm-card-actions">
      <Button icon={<EyeOutlined />} onClick={() => onView(record)}>
        View
      </Button>
      <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
        Edit
      </Button>
      <Popconfirm
        title="Delete this site?"
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
// Expense form (used inside a Modal, for both add & edit)
// =====================================================================
const ExpenseForm = ({ form, onFinish, submitting }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Form.Item
      label="Category"
      name="category"
      rules={[{ required: true, message: "Select a category" }]}
    >
      <Select options={CATEGORY_OPTIONS} placeholder="Select" />
    </Form.Item>
    <Form.Item
      label="Amount"
      name="amount"
      rules={[{ required: true, message: "Amount is required" }]}
    >
      <InputNumber min={0} style={{ width: "100%" }} placeholder="0" prefix="Rs." />
    </Form.Item>
    <Form.Item
      label="Date"
      name="date"
      tooltip="Khali chhodein to aaj ki date automatic save ho jayegi"
    >
      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" allowClear placeholder="DD/MM/YYYY (optional)" />
    </Form.Item>
    <Form.Item label="Description" name="description">
      <Input.TextArea rows={3} placeholder="Optional notes…" />
    </Form.Item>
    <Form.Item className="sm-form-actions">
      <Button type="primary" htmlType="submit" loading={submitting} block>
        Save expense
      </Button>
    </Form.Item>
  </Form>
);

// =====================================================================
// Material form (used inside a Modal, for both add & edit)
// =====================================================================
const MaterialForm = ({ form, onFinish, submitting }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <div className="sm-form-grid">
      <Form.Item
        label="Material Name"
        name="materialName"
        rules={[{ required: true, message: "Material name is required" }]}
      >
        <Input placeholder="e.g. Cement" />
      </Form.Item>
      <Form.Item
        label="Quantity"
        name="quantity"
        rules={[{ required: true, message: "Quantity is required" }]}
      >
        <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
      </Form.Item>
      <Form.Item label="Unit" name="unit">
        <Input placeholder="e.g. bags, sq.ft, pieces" />
      </Form.Item>
      <Form.Item label="Estimated Value" name="estimatedValue">
        <InputNumber min={0} style={{ width: "100%" }} placeholder="0" prefix="Rs." />
      </Form.Item>
      <Form.Item label="Brought By" name="broughtBy">
        <Select options={BROUGHT_BY_OPTIONS} placeholder="Select" />
      </Form.Item>
      <Form.Item
        label="Date"
        name="date"
        tooltip="Khali chhodein to aaj ki date automatic save ho jayegi"
      >
        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" allowClear placeholder="DD/MM/YYYY (optional)" />
      </Form.Item>
    </div>
    <Form.Item label="Notes" name="notes">
      <Input.TextArea rows={3} placeholder="Optional notes…" />
    </Form.Item>
    <Form.Item className="sm-form-actions">
      <Button type="primary" htmlType="submit" loading={submitting} block>
        Save material entry
      </Button>
    </Form.Item>
  </Form>
);

// =====================================================================
// Site detail drawer — profile + summary + expenses tab + materials tab
// =====================================================================
const SiteDetailDrawer = ({ open, siteId, onClose }) => {
  const dispatch = useDispatch();
  const {
    selectedSite,
    summary,
    expenses,
    expensesPagination,
    materials,
    materialsPagination,
    detail_status,
    expense_status,
    material_status,
  } = useSelector((state) => state.site || {});

  const loading = detail_status === "loading";
  const [activeTab, setActiveTab] = useState("expenses");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm] = Form.useForm();

  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialForm] = Form.useForm();

  const refetch = useCallback(
    (p = page) => {
      if (siteId) dispatch(getSingleSiteAsync({ id: siteId, page: p, limit }));
    },
    [dispatch, siteId, page],
  );

  useEffect(() => {
    if (open && siteId) {
      setPage(1);
      dispatch(getSingleSiteAsync({ id: siteId, page: 1, limit }));
    }
    if (!open) dispatch(clearSelectedSite());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, siteId]);

  const handlePageChange = (p) => {
    setPage(p);
    refetch(p);
  };

  // ---------- expense add/edit ----------
  const openAddExpense = () => {
    setEditingExpense(null);
    expenseForm.resetFields();
    setExpenseModalOpen(true);
  };
  const openEditExpense = (record) => {
    setEditingExpense(record);
    expenseForm.setFieldsValue({
      ...record,
      date: record.date ? dayjs(record.date, "DD/MM/YYYY") : null,
    });
    setExpenseModalOpen(true);
  };
  const closeExpenseModal = () => {
    setExpenseModalOpen(false);
    setEditingExpense(null);
    expenseForm.resetFields();
  };
  const submitExpense = async (values) => {
    const payload = {
      ...values,
      date: values.date ? values.date.format("DD/MM/YYYY") : undefined,
    };
    try {
      if (editingExpense) {
        await dispatch(
          updateSiteExpenseAsync({ id: editingExpense._id, ...payload }),
        ).unwrap();
      } else {
        await dispatch(createSiteExpenseAsync({ siteId, ...payload })).unwrap();
      }
      closeExpenseModal();
      refetch();
    } catch (err) {
      // inline / thunk error already surfaced via state
    }
  };
  const handleDeleteExpense = async (record) => {
    await dispatch(deleteSiteExpenseAsync(record._id)).unwrap();
    refetch();
  };

  // ---------- material add/edit ----------
  const openAddMaterial = () => {
    setEditingMaterial(null);
    materialForm.resetFields();
    setMaterialModalOpen(true);
  };
  const openEditMaterial = (record) => {
    setEditingMaterial(record);
    materialForm.setFieldsValue({
      ...record,
      date: record.date ? dayjs(record.date, "DD/MM/YYYY") : null,
    });
    setMaterialModalOpen(true);
  };
  const closeMaterialModal = () => {
    setMaterialModalOpen(false);
    setEditingMaterial(null);
    materialForm.resetFields();
  };
  const submitMaterial = async (values) => {
    const payload = {
      ...values,
      date: values.date ? values.date.format("DD/MM/YYYY") : undefined,
    };
    try {
      if (editingMaterial) {
        await dispatch(
          updateSiteMaterialAsync({ id: editingMaterial._id, ...payload }),
        ).unwrap();
      } else {
        await dispatch(createSiteMaterialAsync({ siteId, ...payload })).unwrap();
      }
      closeMaterialModal();
      refetch();
    } catch (err) {
      // inline / thunk error already surfaced via state
    }
  };
  const handleDeleteMaterial = async (record) => {
    await dispatch(deleteSiteMaterialAsync(record._id)).unwrap();
    refetch();
  };

  const expenseColumns = [
    { title: "Date", dataIndex: "date", key: "date", width: 110 },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (v) => <Tag>{statusLabel(CATEGORY_OPTIONS, v)}</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (v) => v || "—",
    },
    { title: "Amount", dataIndex: "amount", key: "amount", render: money },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      render: (_, record) => (
        <div className="sm-actions-cell">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditExpense(record)} />
          <Popconfirm
            title="Delete this expense?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteExpense(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const materialColumns = [
    { title: "Date", dataIndex: "date", key: "date", width: 110 },
    { title: "Material", dataIndex: "materialName", key: "materialName" },
    {
      title: "Quantity",
      key: "quantity",
      render: (_, r) => `${r.quantity ?? "—"} ${r.unit || ""}`.trim(),
    },
    { title: "Est. Value", dataIndex: "estimatedValue", key: "estimatedValue", render: money },
    {
      title: "Brought By",
      dataIndex: "broughtBy",
      key: "broughtBy",
      render: (v) => statusLabel(BROUGHT_BY_OPTIONS, v),
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      render: (_, record) => (
        <div className="sm-actions-cell">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditMaterial(record)} />
          <Popconfirm
            title="Delete this material entry?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteMaterial(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const activePagination = activeTab === "expenses" ? expensesPagination : materialsPagination;
  const { total = 0 } = activePagination || {};

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={selectedSite ? `${selectedSite.name} — Site Detail` : "Site Detail"}
      width={760}
      className="sm-drawer"
      destroyOnClose
    >
      <Spin spinning={loading}>
        {selectedSite && (
          <>
            <div className="sm-drawer-header">
              <Avatar size={56} icon={<EnvironmentOutlined />} className="sm-avatar sm-avatar-lg" />
              <div>
                <h3>{selectedSite.name}</h3>
                <span className="sm-drawer-location">{selectedSite.location || "No location set"}</span>
              </div>
              <Tag color={STATUS_TAG[selectedSite.status]?.color || "default"} className="sm-drawer-status">
                {STATUS_TAG[selectedSite.status]?.label || selectedSite.status}
              </Tag>
            </div>

            <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered className="sm-drawer-descriptions">
              <Descriptions.Item label="Owner / Client">{selectedSite.ownerName || "—"}</Descriptions.Item>
              <Descriptions.Item label="Start Date">{selectedSite.startDate || "—"}</Descriptions.Item>
              <Descriptions.Item label="Created">{fmtDate(selectedSite.created_at)}</Descriptions.Item>
              <Descriptions.Item label="Status">
                {STATUS_TAG[selectedSite.status]?.label || selectedSite.status}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedSite.description || "—"}
              </Descriptions.Item>
            </Descriptions>

            {summary && typeof summary === "object" && Object.keys(summary).length > 0 && (
              <div className="sm-summary-block">
                <div className="sm-section-title">Site Summary</div>
                <Row gutter={[12, 12]}>
                  {Object.entries(summary).map(([key, value]) => {
                    if (value !== null && typeof value === "object") return null;
                    return (
                      <Col xs={12} sm={8} key={key}>
                        <div className="sm-stat-card">
                          <Statistic
                            title={humanizeKey(key)}
                            value={isMoneyKey(key) && typeof value === "number" ? value : (value ?? "—")}
                            prefix={isMoneyKey(key) && typeof value === "number" ? "Rs." : undefined}
                          />
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            )}

            <Tabs
              activeKey={activeTab}
              onChange={(k) => {
                setActiveTab(k);
                setPage(1);
              }}
              className="sm-tabs"
              items={[
                {
                  key: "expenses",
                  label: "Expenses",
                  children: (
                    <>
                      <div className="sm-tab-toolbar">
                        <Button type="primary" icon={<PlusOutlined />} onClick={openAddExpense}>
                          Add Expense
                        </Button>
                      </div>
                      <Table
                        rowKey="_id"
                        size="small"
                        columns={expenseColumns}
                        dataSource={expenses}
                        pagination={false}
                        loading={expense_status === "loading"}
                        scroll={{ x: 600 }}
                        locale={{ emptyText: <Empty description="No expenses yet" /> }}
                      />
                    </>
                  ),
                },
                {
                  key: "materials",
                  label: "Materials",
                  children: (
                    <>
                      <div className="sm-tab-toolbar">
                        <Button type="primary" icon={<PlusOutlined />} onClick={openAddMaterial}>
                          Add Material
                        </Button>
                      </div>
                      <Table
                        rowKey="_id"
                        size="small"
                        columns={materialColumns}
                        dataSource={materials}
                        pagination={false}
                        loading={material_status === "loading"}
                        scroll={{ x: 650 }}
                        locale={{ emptyText: <Empty description="No material entries yet" /> }}
                      />
                    </>
                  ),
                },
              ]}
            />

            {total > limit && (
              <div className="sm-recent-pagination">
                <Pagination simple current={page} pageSize={limit} total={total} onChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </Spin>

      {/* Add / Edit Expense */}
      <Modal
        open={expenseModalOpen}
        onCancel={closeExpenseModal}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
        footer={null}
        width={440}
        destroyOnClose
      >
        <ExpenseForm form={expenseForm} onFinish={submitExpense} submitting={expense_status === "loading"} />
      </Modal>

      {/* Add / Edit Material */}
      <Modal
        open={materialModalOpen}
        onCancel={closeMaterialModal}
        title={editingMaterial ? "Edit Material Entry" : "Add Material Entry"}
        footer={null}
        width={520}
        destroyOnClose
      >
        <MaterialForm form={materialForm} onFinish={submitMaterial} submitting={material_status === "loading"} />
      </Modal>
    </Drawer>
  );
};

// =====================================================================
// Main page — master site profiles
// =====================================================================
const SiteManagement = () => {
  const dispatch = useDispatch();

  const siteState = useSelector((state) => state.site || {});
  const { sites = [], pagination = {}, get_status, get_error: error } = siteState;
  const { total = 0 } = pagination;

  const loading = get_status === "loading";

  // ---------- filters & pagination ----------
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const searchDebounceRef = useRef(null);

  // ---------- modals / drawer ----------
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewSiteId, setViewSiteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();

  const buildParams = useCallback(
    (overrides = {}) => {
      const params = {
        search: search || undefined,
        status: status || undefined,
        page,
        limit: pageSize,
        ...overrides,
      };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      return params;
    },
    [search, status, page, pageSize],
  );

  const fetchList = useCallback(
    (overrides = {}) => dispatch(getSitesAsync(buildParams(overrides))),
    [dispatch, buildParams],
  );

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, status]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      dispatch(getSitesAsync(buildParams({ search: value || undefined, page: 1 })));
    }, 400);
  };

  const resetFilters = () => {
    setSearch("");
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
      startDate: record.startDate ? dayjs(record.startDate, "DD/MM/YYYY") : null,
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
        startDate: values.startDate ? values.startDate.format("DD/MM/YYYY") : undefined,
      };

      if (editingRecord) {
        await dispatch(updateSiteAsync({ id: editingRecord._id, ...payload })).unwrap();
      } else {
        await dispatch(createSiteAsync(payload)).unwrap();
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
      await dispatch(deleteSiteAsync(record._id)).unwrap();
      fetchList();
    } finally {
      setDeletingId(null);
    }
  };

  // ---------- table columns ----------
  const columns = useMemo(
    () => [
      {
        title: "Site",
        dataIndex: "name",
        key: "name",
        fixed: "left",
        width: 220,
        render: (v, r) => (
          <div className="sm-name-cell">
            <Avatar size={32} icon={<EnvironmentOutlined />} className="sm-avatar" />
            <div>
              <div className="sm-name-cell-name">{v}</div>
              <div className="sm-name-cell-loc">{r.location || "—"}</div>
            </div>
          </div>
        ),
      },
      {
        title: "Owner / Client",
        dataIndex: "ownerName",
        key: "ownerName",
        width: 160,
        render: (v) => v || "—",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (v) => <Tag color={STATUS_TAG[v]?.color || "default"}>{STATUS_TAG[v]?.label || v}</Tag>,
      },
      {
        title: "Start Date",
        dataIndex: "startDate",
        key: "startDate",
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
          <div className="sm-actions-cell">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewSiteId(record._id)} />
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
            <Popconfirm
              title="Delete this site?"
              description={`Remove ${record.name} permanently?`}
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
    <div className="sm-root">
      <div className="sm-header">
        <div className="sm-header-top">
          <div>
            <Title level={3} className="sm-title">
              Site Management
            </Title>
            <span className="sm-subtitle">
              Master site profiles — expenses & material entries live on each site's detail view
            </span>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} className="sm-add-btn" onClick={openAddModal}>
          Add Site
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={typeof error === "string" ? error : "Something went wrong"}
          className="sm-error-alert"
        />
      )}

      <div className="sm-filters-card">
        <div className="sm-filters">
          <div className="sm-filters-row">
            <Input
              allowClear
              className="sm-search"
              placeholder="Search by name, location or owner…"
              prefix={<SearchOutlined />}
              value={search}
              onChange={handleSearchChange}
            />
            <Select
              allowClear
              className="sm-filter-select"
              placeholder="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            />
          </div>
          <div className="sm-filters-footer">
            <Button type="link" className="sm-reset-btn" icon={<ReloadOutlined />} onClick={resetFilters}>
              Reset filters
            </Button>
            <span className="sm-result-count">{total} site(s)</span>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* ---- Mobile card list ---- */}
        <div className="sm-card-list">
          {sites.length === 0 && !loading ? (
            <Empty description="No sites found" />
          ) : (
            sites.map((record) => (
              <SiteCard
                key={record._id}
                record={record}
                onView={(r) => setViewSiteId(r._id)}
                onEdit={openEditModal}
                onDelete={handleDelete}
                deleting={deletingId === record._id}
              />
            ))
          )}
          {sites.length > 0 && (
            <div className="sm-pagination-mobile">
              <Pagination simple current={page} pageSize={pageSize} total={total} onChange={setPage} />
            </div>
          )}
        </div>

        {/* ---- Tablet / laptop / desktop table ---- */}
        <div className="sm-table-wrap">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={sites}
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
      <SiteDetailDrawer open={!!viewSiteId} siteId={viewSiteId} onClose={() => setViewSiteId(null)} />

      {/* =================== ADD / EDIT SITE MODAL =================== */}
      <Modal
        open={formOpen}
        onCancel={closeFormModal}
        title={editingRecord ? "Edit Site" : "Add Site"}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="sm-form-grid">
            <Form.Item label="Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
              <Input placeholder="e.g. DHA Phase 6 — Villa 12" />
            </Form.Item>
            <Form.Item label="Location" name="location">
              <Input placeholder="e.g. Karachi" />
            </Form.Item>
            <Form.Item label="Owner / Client Name" name="ownerName">
              <Input placeholder="e.g. Mr. Ahmed" />
            </Form.Item>
            {editingRecord && (
              <Form.Item label="Status" name="status">
                <Select options={STATUS_OPTIONS} placeholder="Select" />
              </Form.Item>
            )}
            <Form.Item
              label="Start Date"
              name="startDate"
              tooltip="Khali chhodein to aaj ki date automatic save ho jayegi"
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="DD/MM/YYYY (optional)" allowClear />
            </Form.Item>
          </div>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional notes…" />
          </Form.Item>
          <Form.Item className="sm-form-actions">
            <Button type="primary" htmlType="submit" loading={submitting} block>
              {editingRecord ? "Save changes" : "Create site"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SiteManagement;