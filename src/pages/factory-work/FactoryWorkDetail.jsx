import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  Tag,
  Button,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Radio,
  Input,
  Spin,
  Empty,
  Typography,
  Select,
  Steps,
} from "antd";
import {
  ArrowLeftOutlined,
  DollarOutlined,
  CarOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getSingleFactoryWorkAsync,
  addFactoryPaymentAsync,
  updateMaterialMovementAsync,
  updateSiteArrivalAsync,
  setVehicleInfoAsync,
  addVehiclePaymentAsync,
} from "../../store/services/factoryWorkService";
import { clearSingleWork } from "../../store/slices/factoryWorkSlice";
import "./FactoryWork.css";

const { Title } = Typography;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_factory", label: "In Factory" },
  { value: "ready", label: "Ready" },
  { value: "on_the_way", label: "On the Way" },
  { value: "received", label: "Received" },
  { value: "checked", label: "Checked" },
  { value: "completed", label: "Completed" },
];
const STATUS_COLOR = {
  pending: "warning",
  in_factory: "processing",
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

const vehicleOptions = [
  "Suzuki",
  "Bike",
  "Car",
  "High Roof Van",
  "Auto rickshaw",
];

const statusLabel = (v) =>
  STATUS_OPTIONS.find((o) => o.value === v)?.label || v || "—";
const rs = (v) => (v != null ? `Rs. ${Number(v).toLocaleString()}` : "—");
const fmtDate = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—");

const FactoryWorkDetail = () => {
  const { workId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { singleWork: work, get_single_status } = useSelector(
    (state) => state.factoryWork || {},
  );
  const loading = get_single_status === "loading";

  const [activeAction, setActiveAction] = useState(null); // "payment" | "movement" | "arrival" | "vehicle" | "vehiclePayment"
  const [submitting, setSubmitting] = useState(false);

  const [paymentForm] = Form.useForm();
  const [movementForm] = Form.useForm();
  const [arrivalForm] = Form.useForm();
  const [vehicleForm] = Form.useForm();
  const [vehiclePaymentForm] = Form.useForm();

  useEffect(() => {
    dispatch(getSingleFactoryWorkAsync(workId));
    return () => dispatch(clearSingleWork());
  }, [dispatch, workId]);

  const buildProgressSteps = (w) => {
    const hasAdvance =
      w.payments?.some((p) => p.type === "advance") || w.totalPaid > 0;
    return [
      { title: "Factory mai order kar dya hai maal", done: true },
      { title: "Advance payment kar di hai", done: hasAdvance },
      {
        title: "Factory sai maal kab nikla",
        done: !!w.materialMovement?.leftFactoryDate,
      },
      { title: "Site par kab aya maal", done: !!w.siteArrival?.arrivalDate },
      {
        title: "Maal check/recive kar lya hai",
        done:
          w.siteArrival?.materialChecked === "checked" ? "checked" : "received",
      },
      {
        title: "Fully Payment kar di hain",
        done: w.paymentStatus === "fully_paid",
      },
    ];
  };

  // 🆕 Movement + Vehicle ek sath save (agar vehicle info di gayi ho)
  const handleMovementSubmit = async () => {
    try {
      const values = await movementForm.validateFields();
      setSubmitting(true);
      const leftFactoryDate = values.leftFactoryDate.format("YYYY-MM-DD");

      await dispatch(
        updateMaterialMovementAsync({
          workId,
          leftFactoryDate,
          vehicleUsed: values.vehicleUsed,
          notes: values.notes,
        }),
      ).unwrap();

      // Agar vehicle ka rent bhi diya hai, usi waqt vehicle record bhi ban jaye
      if (values.vehicleUsed && values.vehicleTotalRent) {
        await dispatch(
          setVehicleInfoAsync({
            workId,
            vehicleType: values.vehicleUsed,
            totalRent: values.vehicleTotalRent,
            advanceAmount: values.vehicleAdvanceAmount,
            advanceDate: values.vehicleAdvanceDate
              ? values.vehicleAdvanceDate.format("YYYY-MM-DD")
              : undefined,
            pickupDate: leftFactoryDate, // 🆕 same date, dobara nahi poochna
          }),
        ).unwrap();
      }

      setActiveAction(null);
      movementForm.resetFields();
      dispatch(getSingleFactoryWorkAsync(workId));
    } catch (err) {
      // errors handled inline
    } finally {
      setSubmitting(false);
    }
  };

  // 🆕 Site Arrival + vehicle ki arrival date bhi auto-sync (agar vehicle already set hai)
  const handleArrivalSubmit = async () => {
    try {
      const values = await arrivalForm.validateFields();
      setSubmitting(true);
      const arrivalDate = values.arrivalDate.format("YYYY-MM-DD");

      await dispatch(
        updateSiteArrivalAsync({
          workId,
          arrivalDate,
          materialChecked: values.materialChecked,
          notes: values.notes,
        }),
      ).unwrap();

      if (work.vehicle?.vehicleType) {
        await dispatch(setVehicleInfoAsync({ workId, arrivalDate })).unwrap();
      }

      setActiveAction(null);
      arrivalForm.resetFields();
      dispatch(getSingleFactoryWorkAsync(workId));
    } catch (err) {
      // errors handled inline
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (thunk, form, dateKeys = []) => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = { ...values };
      dateKeys.forEach((k) => {
        if (payload[k]) payload[k] = payload[k].format("YYYY-MM-DD");
      });
      await dispatch(thunk({ workId, ...payload })).unwrap();
      setActiveAction(null);
      form.resetFields();
    } catch (err) {
      // errors handled inline
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !work) {
    return (
      <div className="fw-root">
        <Spin spinning={loading}>
          {!loading && <Empty description="Record not found" />}
        </Spin>
      </div>
    );
  }

  return (
    <div className="fw-root">
      <Button
        icon={<ArrowLeftOutlined />}
        type="link"
        className="fw-reset-btn"
        onClick={() => navigate(-1)}
      >
        Back to list
      </Button>

      <div className="fw-header" style={{ marginTop: 8 }}>
        <div className="fw-header-top">
          <div>
            <Title level={3} className="fw-title">
              {work.factoryName}
            </Title>
            <span className="fw-subtitle">
              {work.workMaterialName} — {work.quantity || "—"}
            </span>
          </div>
          <Tag color={STATUS_COLOR[work.status] || "default"}>
            {statusLabel(work.status)}
          </Tag>
        </div>
      </div>

      {/* 🆕 PROGRESS STEPPER */}
      <Steps
        className="fw-progress-steps"
        current={buildProgressSteps(work).filter((s) => s.done).length}
        size="small"
        items={buildProgressSteps(work).map((s) => ({ title: s.title }))}
      />

      {/* ---- Factory Payment ---- */}
      <div className="fw-view-section">
        <div className="fw-view-section-head">
          <span className="fw-view-section-title">
            <DollarOutlined />
            Factory Payment
          </span>
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => setActiveAction("payment")}
          >
            Add Payment
          </Button>
        </div>
        <div className="fw-stat-grid">
          <div className="fw-stat-box">
            <div className="fw-field-label">Total Amount</div>
            <div className="fw-stat-value">{rs(work.totalAmount)}</div>
          </div>
          <div className="fw-stat-box">
            <div className="fw-field-label">Paid Amount</div>
            <div className="fw-stat-value">{rs(work.totalPaid)}</div>
          </div>
          <div className="fw-stat-box">
            <div className="fw-field-label">Remaining Amount</div>
            <div className="fw-stat-value fw-remaining">
              {rs(work.remainingAmount)}
            </div>
          </div>
          <div className="fw-stat-box">
            <div className="fw-field-label">Status</div>
            <Tag color={PAYMENT_COLOR[work.paymentStatus] || "default"}>
              {work.paymentStatus?.replace("_", " ")}
            </Tag>
          </div>

          <div className="fw-stat-box">
            <div className="fw-field-label">Completion Date</div>
            {fmtDate(work.expectedCompletionDate)}
          </div>
        </div>
        {work.payments?.length > 0 ? (
          <div style={{ marginTop: 10 }}>
            {work.payments.map((p) => (
              <div key={p._id} className="fw-payment-row">
                <span>
                  {p.type === "advance" ? "Advance" : "Final Payment"}
                  {p.note && <div className="fw-payment-note">{p.note}</div>}
                </span>
                <strong>
                  {rs(p.amount)} — {fmtDate(p.date)}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="fw-empty-hint">No payments recorded yet</div>
        )}
      </div>

      {/* ---- Material Movement ---- */}
      <div className="fw-view-section">
        <div className="fw-view-section-head">
          <span className="fw-view-section-title">
            <CarOutlined />
            Factory sai kab nikla maal
          </span>
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => setActiveAction("movement")}
          >
            Record Movement
          </Button>
        </div>
        <div className="fw-stat-grid">
          <div className="fw-stat-box">
            <div className="fw-field-label">Factory Se Nikla</div>
            <div className="fw-field-value">
              {fmtDate(work.materialMovement?.leftFactoryDate)}
            </div>
          </div>
          <div className="fw-stat-box">
            <div className="fw-field-label">Vehicle Used</div>
            <div className="fw-field-value">
              {work.materialMovement?.vehicleUsed || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Site Arrival ---- */}
      <div className="fw-view-section">
        <div className="fw-view-section-head">
          <span className="fw-view-section-title">
            <EnvironmentOutlined />
            Site par kab aya maal
          </span>
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => setActiveAction("arrival")}
          >
            Record Arrival
          </Button>
        </div>
        <div className="fw-stat-grid">
          <div className="fw-stat-box">
            <div className="fw-field-label">Site Par Aya</div>
            <div className="fw-field-value">
              {fmtDate(work.siteArrival?.arrivalDate)}
            </div>
          </div>
          <div className="fw-stat-box">
            <div className="fw-field-label">Material Checked</div>
            <div className="fw-field-value">
              {work.siteArrival?.materialChecked?.replace("_", " ") || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Vehicle ---- */}
      <div className="fw-view-section">
        <div className="fw-view-section-head">
          <span className="fw-view-section-title">
            <CheckCircleOutlined />
            Transfer Service Payment
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {!work.vehicle?.vehicleType ? (
              // 🆕 sirf fallback ke liye — agar movement step mein vehicle skip kar diya tha
              <Button size="small" onClick={() => setActiveAction("vehicle")}>
                Add Vehicle
              </Button>
            ) : (
              <>
                <Button size="small" onClick={() => setActiveAction("vehicle")}>
                  Edit
                </Button>
                <Button
                  size="small"
                  type="primary"
                  ghost
                  onClick={() => setActiveAction("vehiclePayment")}
                >
                  Add Payment
                </Button>
              </>
            )}
            {/* {work.vehicle?.vehicleType && (
              <Button
                size="small"
                type="primary"
                ghost
                onClick={() => setActiveAction("vehiclePayment")}
              >
                Add Payment
              </Button>
            )} */}
          </div>
        </div>
        {work.vehicle?.vehicleType ? (
          <>
            <div className="fw-stat-grid">
              <div className="fw-stat-box">
                <div className="fw-field-label">Vehicle</div>
                <div className="fw-stat-value">{work.vehicle.vehicleType}</div>
              </div>
              <div className="fw-stat-box">
                <div className="fw-field-label">Total Rent</div>
                <div className="fw-stat-value">
                  {rs(work.vehicle.totalRent)}
                </div>
              </div>
              <div className="fw-stat-box">
                <div className="fw-field-label">Paid</div>
                <div className="fw-stat-value">
                  {rs(work.vehicle.totalPaid)}
                </div>
              </div>
              <div className="fw-stat-box">
                <div className="fw-field-label">Remaining</div>
                <div className="fw-stat-value fw-remaining">
                  {rs(work.vehicle.remainingAmount)}
                </div>
              </div>
            </div>
            {work.vehicle.payments?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {work.vehicle.payments.map((p, i) => (
                  <div key={i} className="fw-payment-row">
                    <span>
                      {p.type === "advance" ? "Advance" : "Final Payment"}
                    </span>
                    <strong>
                      {rs(p.amount)} — {fmtDate(p.date)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="fw-empty-hint">No vehicle added yet</div>
        )}
      </div>

      {/* =================== QUICK ACTION MODALS =================== */}
      <Modal
        open={activeAction === "payment"}
        onCancel={() => setActiveAction(null)}
        title="Add Factory Payment"
        footer={null}
        destroyOnClose
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={() =>
            runAction(addFactoryPaymentAsync, paymentForm, ["date"])
          }
        >
          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true }]}
            initialValue="payment"
          >
            <Radio.Group>
              <Radio.Button value="advance">Advance</Radio.Button>
              <Radio.Button value="payment">Final Payment</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Date" name="date">
            <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
          </Form.Item>
          <Form.Item label="Note" name="note">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Save Payment
          </Button>
        </Form>
      </Modal>

      <Modal
        open={activeAction === "movement"}
        onCancel={() => setActiveAction(null)}
        title="Record Material Movement"
        footer={null}
        destroyOnClose
      >
        <Form
          form={movementForm}
          layout="vertical"
          onFinish={handleMovementSubmit}
        >
          <Form.Item
            label="Material Left Factory Date"
            name="leftFactoryDate"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
          </Form.Item>
          <Form.Item label="Vehicle Used" name="vehicleUsed">
            <Select placeholder="Vehicle choose karo" allowClear>
              {vehicleOptions.map((vehicle) => (
                <Select.Option key={vehicle} value={vehicle}>
                  {vehicle}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* 🆕 Vehicle rent yahin capture — separate step ki zaroorat nahi */}
          <div className="fw-inline-hint">
            Agar vehicle ka kiraya pata hai, yahin daal dein (optional)
          </div>
          <Form.Item label="Vehicle Total Rent" name="vehicleTotalRent">
            <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
          </Form.Item>
          <Form.Item label="Vehicle Advance Amount" name="vehicleAdvanceAmount">
            <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
          </Form.Item>
          <Form.Item label="Vehicle Advance Date" name="vehicleAdvanceDate">
            <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Save
          </Button>
        </Form>
      </Modal>

      <Modal
        open={activeAction === "arrival"}
        onCancel={() => setActiveAction(null)}
        title="Record Site Arrival"
        footer={null}
        destroyOnClose
      >
        <Form
          form={arrivalForm}
          layout="vertical"
          onFinish={handleArrivalSubmit}
        >
          <Form.Item
            label="Site Arrival Date"
            name="arrivalDate"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
          </Form.Item>
          <Form.Item
            label="Material Checked"
            name="materialChecked"
            rules={[{ required: true, message: "Required" }]}
          >
            <Radio.Group>
              <Radio.Button value="received">Received</Radio.Button>
              <Radio.Button value="checked">Checked</Radio.Button>
              <Radio.Button value="issue_found">Issue Found</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Save
          </Button>
        </Form>
      </Modal>

      <Modal
        open={activeAction === "vehicle"}
        onCancel={() => setActiveAction(null)}
        title="Vehicle Info"
        footer={null}
        destroyOnClose
      >
        <Form
          form={vehicleForm}
          layout="vertical"
          initialValues={{
            vehicleType: work.vehicle?.vehicleType,
            totalRent: work.vehicle?.totalRent,
          }}
          onFinish={() =>
            runAction(setVehicleInfoAsync, vehicleForm, [
              "advanceDate",
              "pickupDate",
              "arrivalDate",
            ])
          }
        >
          <Form.Item
            label="Vehicle Type"
            name="vehicleType"
            rules={[{ required: true, message: "Required" }]}
          >
            {/* <Input placeholder="e.g. Suzuki" /> */}
            <Select placeholder="Vehicle choose karo">
              {vehicleOptions.map((vehicle) => (
                <Select.Option key={vehicle} value={vehicle}>
                  {vehicle}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Total Vehicle Amount"
            name="totalRent"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Advance Amount" name="advanceAmount">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Advance Date" name="advanceDate">
            <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
          </Form.Item>
          {/* <Form.Item label="Material Pickup Date" name="pickupDate">
            <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
          </Form.Item>
          <Form.Item label="Site Arrival Date" name="arrivalDate">
            <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
          </Form.Item> */}
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Save Vehicle Info
          </Button>
        </Form>
      </Modal>

      <Modal
        open={activeAction === "vehiclePayment"}
        onCancel={() => setActiveAction(null)}
        title="Add Vehicle Payment"
        footer={null}
        destroyOnClose
      >
        <Form
          form={vehiclePaymentForm}
          layout="vertical"
          onFinish={() =>
            runAction(addVehiclePaymentAsync, vehiclePaymentForm, ["date"])
          }
        >
          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true }]}
            initialValue="payment"
          >
            <Radio.Group>
              <Radio.Button value="advance">Advance</Radio.Button>
              <Radio.Button value="payment">Final Payment</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Date" name="date">
            <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Save
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default FactoryWorkDetail;
