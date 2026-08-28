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
  Empty,
  Spin,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getWorkOrdersAsync,
  getSingleWorkOrderAsync,
  createWorkOrderAsync,
  updateWorkOrderAsync,
  deleteWorkOrderAsync,
  createSampleRoundAsync,
  updateSampleRoundAsync,
} from "../store/services/workOrderService.js";
import { getSitesListAsync } from "../store/services/siteService";
import { clearSelectedWorkOrder } from "../store/slices/workOrderSlice";
import { usePdfDownload } from "../utils/usePdfDowload.js";
import companyLogo from "../../public/haroon-marbles-logo.png";
import employerSignature from "/public/signature.png";
import "./WorkOrderManagement.css";
import "./report-sheet.css";

const { Title } = Typography;

const STATUS_OPTIONS = [
  { value: "pending_sample", label: "Pending Sample" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
const STATUS_COLOR = {
  pending_sample: "default",
  in_review: "warning",
  approved: "processing",
  in_progress: "processing",
  completed: "success",
  cancelled: "error",
};
const RESPONSE_COLOR = { pending: "pending", approved: "approved", rejected: "rejected" };
const labelOf = (opts, v) => opts.find((o) => o.value === v)?.label || v || "—";
const siteName = (site, sitesList) =>
  (typeof site === "object" ? site?.name : sitesList.find((s) => s._id === site)?.name) || "—";

// =====================================================================
// Timeline drawer — sample rounds + printable report
// =====================================================================
const WorkOrderDrawer = ({ open, workOrderId, onClose }) => {
  const dispatch = useDispatch();
  const { selectedWorkOrder, rounds = [], stats, detail_status } = useSelector((s) => s.workOrder || {});
  const { downloadPdf, downloading } = usePdfDownload();
  const printRef = useRef(null);
  const loading = detail_status === "loading";

  const [roundFormOpen, setRoundFormOpen] = useState(false);
  const [respondingRound, setRespondingRound] = useState(null);
  const [form] = Form.useForm();
  const [respondForm] = Form.useForm();

  useEffect(() => {
    if (open && workOrderId) dispatch(getSingleWorkOrderAsync(workOrderId));
    if (!open) dispatch(clearSelectedWorkOrder());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workOrderId]);

  const refresh = () => dispatch(getSingleWorkOrderAsync(workOrderId));

  const handleAddRound = async () => {
    const values = await form.validateFields();
    await dispatch(
      createSampleRoundAsync({
        workOrderId,
        sampleStartDate: values.workStartDate?.format("DD/MM/YYYY"),
        sampleReadyDate: values.sampleReadyDate?.format("DD/MM/YYYY"),
        sentToClientDate: values.sentToClientDate?.format("DD/MM/YYYY"),
      }),
    ).unwrap();
    setRoundFormOpen(false);
    form.resetFields();
    refresh();
  };

  const openRespondModal = (round) => {
    setRespondingRound(round);
    respondForm.setFieldsValue({ responseStatus: round.responseStatus === "pending" ? "approved" : round.responseStatus });
  };

  const handleRespond = async () => {
    const values = await respondForm.validateFields();
    await dispatch(
      updateSampleRoundAsync({
        id: respondingRound._id,
        clientResponseDate: values.clientResponseDate?.format("DD/MM/YYYY"),
        responseStatus: values.responseStatus,
        rejectionNotes: values.rejectionNotes,
      }),
    ).unwrap();
    setRespondingRound(null);
    respondForm.resetFields();
    refresh();
  };

  const handleDownload = () => {
    if (!selectedWorkOrder) return;
    const title = (selectedWorkOrder?.title || "report").replace(/\s+/g, "-");
    downloadPdf(printRef, `work-order-${title}-${dayjs().format("DD-MM-YYYY")}.pdf`);
  };

  const handlePrint = () => window.print();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={selectedWorkOrder?.title || "Work Order"}
      width="90%"
      style={{ maxWidth: 780 }}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {selectedWorkOrder && (
          <>
            <div className="rpt-actions rpt-no-print">
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                Print
              </Button>
              <Button type="primary" icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}>
                Download PDF
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => setRoundFormOpen(true)}>
                Add Work Report
              </Button>
            </div>

            <div className="rpt-sheet" ref={printRef}>
              <div className="rpt-header">
                <img src={companyLogo} alt="Haroon Marbles" className="rpt-logo" />
              </div>
              <div className="rpt-divider" />

              <div className="rpt-meta-grid">
                <div>
                  <div className="rpt-meta-label">Work</div>
                  <div className="rpt-meta-value">{selectedWorkOrder.title}</div>
                </div>
                <div>
                  <div className="rpt-meta-label">Site</div>
                  <div className="rpt-meta-value">
                    {selectedWorkOrder.siteId?.name || selectedWorkOrder.siteName || "—"}
                  </div>
                </div>
                <div>
                  <div className="rpt-meta-label">Status</div>
                  <div className="rpt-meta-value">
                    <Tag color={STATUS_COLOR[selectedWorkOrder.status]}>{labelOf(STATUS_OPTIONS, selectedWorkOrder.status)}</Tag>
                  </div>
                </div>
              </div>

              {stats && (
                <div className="rpt-summary-grid">
                  <div className="rpt-summary-card">
                    <div className="rpt-summary-label">Rejected</div>
                    <div className="rpt-summary-value">{stats.rejectedCount}</div>
                  </div>
                  <div className="rpt-summary-card">
                    <div className="rpt-summary-label">Days in Sample Phase</div>
                    <div className="rpt-summary-value">{stats.daysInSamplePhase ?? "—"}</div>
                  </div>
                </div>
              )}

              <div className="rpt-section-title">Work Report History</div>
              {rounds.length > 0 ? (
                <div className="rpt-table-wrap">
                  <table className="rpt-table">
                    <thead>
                      <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Sent to Client</th>
                        <th>Client Response</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rounds.map((r) => (
                        <tr key={r._id}>
                          <td>{r.sampleStartDate || "—"}</td>
                          <td>{r.sampleReadyDate || "—"}</td>
                          <td>{r.sentToClientDate || "—"}</td>
                          <td>{r.clientResponseDate || "—"}</td>
                          <td>
                            <span className={`rpt-tag rpt-tag--${RESPONSE_COLOR[r.responseStatus]}`}>{r.responseStatus}</span>
                            {r.responseStatus === "pending" && (
                              <Button size="small" type="link" className="rpt-no-print" onClick={() => openRespondModal(r)}>
                                Record response
                              </Button>
                            )}
                          </td>
                          <td>{r.rejectionNotes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty description="Abhi tak koi sample round add nahi hua" className="rpt-no-print" />
              )}

              <div className="rpt-signatures">
                <div className="rpt-signature-block">
                  <img src={employerSignature} alt="Employer signature" className="rpt-signature-image" />
                  <div className="rpt-signature-line" />
                  <div className="rpt-signature-label">Admin Signature</div>
                </div>
              </div>

              <div className="rpt-footer-note">This is a computer-generated report — Haroon Marbles</div>
            </div>
          </>
        )}
      </Spin>

      {/* Add sample round */}
      <Modal open={roundFormOpen} onCancel={() => setRoundFormOpen(false)} title="Add Sample Report" footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleAddRound}>
          <Form.Item label="Work Start Date" name="workStartDate">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Work Ready Date" name="sampleReadyDate">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Sent to Client Date" name="sentToClientDate">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Add Round
          </Button>
        </Form>
      </Modal>

      {/* Record client response */}
      <Modal
        open={!!respondingRound}
        onCancel={() => setRespondingRound(null)}
        title={`Round #${respondingRound?.roundNumber} — Client Response`}
        footer={null}
        destroyOnClose
      >
        <Form form={respondForm} layout="vertical" onFinish={handleRespond}>
          <Form.Item label="Client Response Date" name="clientResponseDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Response" name="responseStatus" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Notes (agar reject hua)" name="rejectionNotes">
            <Input.TextArea rows={3} placeholder="e.g. rang pasand nahi aaya" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Save Response
          </Button>
        </Form>
      </Modal>
    </Drawer>
  );
};

// =====================================================================
// Mobile card — one work order
// =====================================================================
const WorkOrderCard = ({ record, sitesList, onView, onEdit, onDelete, deleting }) => (
  <div className="wo-card">
    <div className="wo-card-top">
      <Avatar size={40} icon={<ShopOutlined />} className="wo-avatar" />
      <div className="wo-card-top-info">
        <div className="wo-card-name">{record.title}</div>
        <div className="wo-card-site">{siteName(record.siteId, sitesList)}</div>
      </div>
      <Tag color={STATUS_COLOR[record.status]}>{labelOf(STATUS_OPTIONS, record.status)}</Tag>
    </div>

    <div className="wo-card-actions">
      <Button icon={<EyeOutlined />} onClick={() => onView(record)}>
        View
      </Button>
      <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
        Edit
      </Button>
      <Popconfirm
        title="Delete this work order?"
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
// Main list page
// =====================================================================
const WorkOrderManagement = () => {
  const dispatch = useDispatch();
  const { workOrders = [], pagination = {}, get_status, get_error: error } = useSelector((s) => s.workOrder || {});
  const { sitesList = [] } = useSelector((s) => s.site || {});
  const { total = 0 } = pagination;
  const loading = get_status === "loading";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(undefined);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();

  const fetchList = useCallback(
    (overrides = {}) =>
      dispatch(getWorkOrdersAsync({ page, limit: pageSize, search: search || undefined, status, ...overrides })),
    [dispatch, page, pageSize, search, status],
  );

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, status]);

  useEffect(() => {
    dispatch(getSitesListAsync());
  }, [dispatch]);

  const resetFilters = () => {
    setSearch("");
    setStatus(undefined);
    setPage(1);
    fetchList({ search: undefined, status: undefined, page: 1 });
  };

  const openAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setFormOpen(true);
  };
  const openEdit = (r) => {
    setEditingRecord(r);
    form.setFieldsValue({
      ...r,
      siteId: typeof r.siteId === "string" ? r.siteId : r.siteId?._id,
      expectedCompletionDate: r.expectedCompletionDate ? dayjs(r.expectedCompletionDate, "DD/MM/YYYY") : null,
    });
    setFormOpen(true);
  };
  const closeFormModal = () => {
    setFormOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        expectedCompletionDate: values.expectedCompletionDate?.format("DD/MM/YYYY"),
      };
      if (editingRecord) {
        await dispatch(updateWorkOrderAsync({ id: editingRecord._id, ...payload })).unwrap();
      } else {
        await dispatch(createWorkOrderAsync(payload)).unwrap();
      }
      closeFormModal();
      fetchList();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    setDeletingId(record._id);
    try {
      await dispatch(deleteWorkOrderAsync(record._id)).unwrap();
      fetchList();
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo(
    () => [
      { title: "Work Name", dataIndex: "title", key: "title", fixed: "left", width: 200 },
      {
        title: "Site",
        dataIndex: "siteId",
        key: "siteId",
        width: 160,
        render: (site) => siteName(site, sitesList),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (v) => <Tag color={STATUS_COLOR[v]}>{labelOf(STATUS_OPTIONS, v)}</Tag>,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 130,
        render: (_, r) => (
          <div className="wo-actions-cell">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setViewId(r._id)} />
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
            <Popconfirm
              title="Delete this work order?"
              okText="Delete"
              okButtonProps={{ danger: true, loading: deletingId === r._id }}
              onConfirm={() => handleDelete(r)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    [sitesList, deletingId],
  );

  return (
    <div className="wo-root">
      <div className="wo-header">
        <div className="wo-header-top">
          <div>
            <Title level={3} className="wo-title">
              Work Reports
            </Title>
            <span className="wo-subtitle">Track sample rounds, approvals, and site progress</span>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} className="wo-add-btn" onClick={openAdd}>
          Add Work Report
        </Button>
      </div>

      {error && <Alert type="error" showIcon message={error} className="wo-error-alert" />}

      <div className="wo-filters-card">
        <div className="wo-filters">
          <div className="wo-filters-row">
            <Input
              allowClear
              className="wo-search"
              prefix={<SearchOutlined />}
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => {
                setPage(1);
                fetchList({ search: search || undefined, page: 1 });
              }}
            />
            <Select
              allowClear
              className="wo-filter-select"
              placeholder="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            />
          </div>
          <div className="wo-filters-footer">
            <Button type="link" className="wo-reset-btn" icon={<ReloadOutlined />} onClick={resetFilters}>
              Reset filters
            </Button>
            <span className="wo-result-count">
              {total} order{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* ---- Mobile card list ---- */}
        <div className="wo-card-list">
          {workOrders.length === 0 && !loading ? (
            <Empty description="Koi work order nahi mila" />
          ) : (
            workOrders.map((record) => (
              <WorkOrderCard
                key={record._id}
                record={record}
                sitesList={sitesList}
                onView={(r) => setViewId(r._id)}
                onEdit={openEdit}
                onDelete={handleDelete}
                deleting={deletingId === record._id}
              />
            ))
          )}
          {workOrders.length > 0 && (
            <div className="wo-pagination-mobile">
              <Pagination simple current={page} pageSize={pageSize} total={total} onChange={setPage} />
            </div>
          )}
        </div>

        {/* ---- Tablet / laptop / desktop table ---- */}
        <div className="wo-table-wrap">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={workOrders}
            scroll={{ x: 650 }}
            locale={{ emptyText: <Empty description="Koi work order nahi mila" /> }}
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

      <WorkOrderDrawer open={!!viewId} workOrderId={viewId} onClose={() => setViewId(null)} />

      <Modal
        open={formOpen}
        onCancel={closeFormModal}
        title={editingRecord ? "Edit Work Report" : "Add Work Report"}
        footer={null}
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Ahmed - Living Room Tiles" />
          </Form.Item>
          <Form.Item label="Site" name="siteId" rules={[{ required: true, message: "Please select a site" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select the site for this work report"
              options={sitesList.map((site) => ({ value: site._id, label: site.name }))}
            />
          </Form.Item>
          {editingRecord && (
            <Form.Item label="Status" name="status">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          )}
          <Form.Item className="wo-form-actions">
            <Button type="primary" htmlType="submit" loading={submitting} block>
              {editingRecord ? "Save changes" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrderManagement;