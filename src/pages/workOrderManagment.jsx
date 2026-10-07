import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Tag, Input, Select, Button, Modal, Form, Popconfirm, Typography, Alert, Pagination, Empty, Spin, Avatar } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  StopOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import {
  getWorkOrdersAsync,
  createWorkOrderAsync,
  updateWorkOrderAsync,
  deleteWorkOrderAsync,
} from "../store/services/workOrderService.js";
import { getSitesListAsync } from "../store/services/siteService";
import { getErrorMessage } from "../utils/toastError.js";
import WorkOrderDrawer from "./work-order/WorkOrderDrawer.jsx";
import { STATUS_OPTIONS, STATUS_COLOR, labelOf } from "./work-order/workOrderConstants.js";
import "./WorkOrderManagement.css";
import "./report-sheet.css";

const { Title } = Typography;

const siteName = (site, sitesList) =>
  (typeof site === "object" ? site?.name : sitesList.find((s) => s._id === site)?.name) || "—";

// =====================================================================
// Mobile card — one work order
// =====================================================================
const WorkOrderCard = ({ record, sitesList, onView, onEdit, onDelete, deleting }) => (
  <div className="wo-card">
    <div className="wo-card-top">
      <Avatar size={40} icon={<ShopOutlined />} className="wo-avatar" />
      <div className="wo-card-top-info">
        <div className="wo-card-name">{record.title}</div>
        <div className="wo-card-site">
          {siteName(record.siteId, sitesList)}
          {record.clientName ? ` · ${record.clientName}` : ""}
        </div>
      </div>
      <Tag color={STATUS_COLOR[record.status]}>{labelOf(STATUS_OPTIONS, record.status)}</Tag>
    </div>

    <div className="wo-card-actions">
      <Button type="primary" icon={<EyeOutlined />} onClick={() => onView(record)}>
        Kholen
      </Button>
      <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
        Edit
      </Button>
      <Popconfirm
        title="Ye work report delete karein?"
        okText="Delete"
        okButtonProps={{ danger: true, loading: deleting }}
        onConfirm={() => onDelete(record)}
      >
        <Button danger icon={<DeleteOutlined />} aria-label="Delete" />
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
      title: r.title,
      clientName: r.clientName,
      siteId: typeof r.siteId === "string" ? r.siteId : r.siteId?._id,
    });
    setFormOpen(true);
  };
  const closeFormModal = () => {
    setFormOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // Site chunte hi Client ka naam site ke owner se bhar do (agar user ne khud na likha ho).
  const handleValuesChange = (changed) => {
    if (!("siteId" in changed)) return;
    const site = sitesList.find((s) => s._id === changed.siteId);
    const currentClient = form.getFieldValue("clientName");
    const previousAutoFill = sitesList.some((s) => s.ownerName && s.ownerName === currentClient);
    if (site?.ownerName && (!currentClient || previousAutoFill)) {
      form.setFieldsValue({ clientName: site.ownerName });
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        siteId: values.siteId,
        clientName: values.clientName?.trim() || "",
      };
      if (editingRecord) {
        await dispatch(updateWorkOrderAsync({ id: editingRecord._id, ...payload })).unwrap();
        toast.success("Work report update ho gayi");
      } else {
        await dispatch(createWorkOrderAsync(payload)).unwrap();
        toast.success("Work report ban gayi — ab Kholen par click karke kaam shuru karein");
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

  // Status manually sirf Cancel / dobara kholna — baaki khud update hota hai.
  const toggleCancel = async () => {
    if (!editingRecord) return;
    const reopening = editingRecord.status === "cancelled";
    setSubmitting(true);
    try {
      await dispatch(
        updateWorkOrderAsync({ id: editingRecord._id, status: reopening ? "pending_sample" : "cancelled" }),
      ).unwrap();
      toast.success(reopening ? "Work report dobara khul gayi" : "Work report cancel ho gayi");
      closeFormModal();
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    setDeletingId(record._id);
    try {
      await dispatch(deleteWorkOrderAsync(record._id)).unwrap();
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err));
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
      { title: "Client", dataIndex: "clientName", key: "clientName", width: 150, render: (v) => v || "—" },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 190,
        render: (v) => <Tag color={STATUS_COLOR[v]}>{labelOf(STATUS_OPTIONS, v)}</Tag>,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 130,
        render: (_, r) => (
          <div className="wo-actions-cell">
            <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => setViewId(r._id)} aria-label="Kholen" />
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} aria-label="Edit" />
            <Popconfirm
              title="Ye work report delete karein?"
              okText="Delete"
              okButtonProps={{ danger: true, loading: deletingId === r._id }}
              onConfirm={() => handleDelete(r)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} aria-label="Delete" />
            </Popconfirm>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <span className="wo-subtitle">Kaam shuru, problems (photos ke sath), mukammal aur client approval</span>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} className="wo-add-btn" onClick={openAdd}>
          Nayi Work Report
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
              placeholder="Kaam, site ya client se search…"
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
              {total} report{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* ---- Mobile card list ---- */}
        <div className="wo-card-list">
          {workOrders.length === 0 && !loading ? (
            <Empty description="Koi work report nahi mili" />
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
            scroll={{ x: 830 }}
            locale={{ emptyText: <Empty description="Koi work report nahi mili" /> }}
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

      <WorkOrderDrawer open={!!viewId} workOrderId={viewId} onClose={() => setViewId(null)} onChanged={() => fetchList()} />

      <Modal
        open={formOpen}
        onCancel={closeFormModal}
        title={editingRecord ? "Work Report Edit Karein" : "Nayi Work Report"}
        footer={null}
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={handleValuesChange} requiredMark={false}>
          <Form.Item label="Kaam ka naam" name="title" rules={[{ required: true, whitespace: true, message: "Kaam ka naam likhein" }]}>
            <Input placeholder="e.g. Ahmed - Living Room Tiles" />
          </Form.Item>
          <Form.Item label="Site" name="siteId" rules={[{ required: true, message: "Site chunein" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Kis site ka kaam hai?"
              options={sitesList.map((site) => ({ value: site._id, label: site.name }))}
            />
          </Form.Item>
          <Form.Item label="Client ka naam" name="clientName" extra="Site chunne par site owner ka naam khud aa jata hai">
            <Input placeholder="e.g. Ahmed Sahab" />
          </Form.Item>
          <Form.Item className="wo-form-actions">
            <Button type="primary" htmlType="submit" loading={submitting} block size="large">
              {editingRecord ? "Save Karein" : "Work Report Banayen"}
            </Button>
          </Form.Item>
          {editingRecord && (
            <Popconfirm
              title={editingRecord.status === "cancelled" ? "Ye work report dobara kholein?" : "Ye work report cancel karein?"}
              okText="Haan"
              cancelText="Nahi"
              onConfirm={toggleCancel}
            >
              <Button
                block
                danger={editingRecord.status !== "cancelled"}
                icon={editingRecord.status === "cancelled" ? <UndoOutlined /> : <StopOutlined />}
                disabled={submitting}
              >
                {editingRecord.status === "cancelled" ? "Dobara Kholein" : "Work Report Cancel Karein"}
              </Button>
            </Popconfirm>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrderManagement;
