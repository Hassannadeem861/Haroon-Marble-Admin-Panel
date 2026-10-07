import React, { useState } from "react";
import { Modal, Form, DatePicker, Input, Radio, Button, Alert } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/toastError.js";
import { roundLabel } from "./workOrderConstants.js";

const notFuture = (minDate) => (d) =>
  d && (d > dayjs().endOf("day") || (minDate && d < dayjs(minDate, "DD/MM/YYYY").startOf("day")));

// onSubmit errors (thunk .unwrap()) yahin toast ho jate hain — caller ko sirf kaam karna hai.
const useSubmit = (onSubmit, onClose, successMessage) => {
  const [submitting, setSubmitting] = useState(false);
  const submit = async (values) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
      if (successMessage) toast.success(successMessage);
      onClose();
    } catch (err) {
      const message = getErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };
  return { submit, submitting };
};

/**
 * Ek date + optional note wala simple modal — "Kaam Shuru", "Kaam Mukammal", "Problem Hal Ho Gayi".
 * onSubmit({ date: "DD/MM/YYYY", note }) ko Promise return karna chahiye.
 */
export const DateNoteModal = ({
  open,
  onClose,
  onSubmit,
  title,
  dateLabel,
  noteLabel,
  notePlaceholder,
  okText,
  successMessage,
  minDate,
  warning,
}) => {
  const { submit, submitting } = useSubmit(
    (values) => onSubmit({ date: values.date.format("DD/MM/YYYY"), note: values.note?.trim() || "" }),
    onClose,
    successMessage,
  );

  return (
    <Modal open={open} onCancel={onClose} title={title} footer={null} destroyOnHidden className="wot-modal">
      {warning && <Alert type="warning" showIcon message={warning} className="wot-modal-alert" />}
      <Form layout="vertical" onFinish={submit} requiredMark={false} initialValues={{ date: dayjs() }}>
        <Form.Item label={dateLabel} name="date" rules={[{ required: true, message: "Date chunein" }]}>
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" inputReadOnly disabledDate={notFuture(minDate)} />
        </Form.Item>
        {noteLabel && (
          <Form.Item label={noteLabel} name="note">
            <Input.TextArea rows={2} maxLength={500} placeholder={notePlaceholder} />
          </Form.Item>
        )}
        <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
          {okText}
        </Button>
      </Form>
    </Modal>
  );
};

/**
 * Client ka jawab — Approved / Rejected (reject par wajah zaroori).
 * onSubmit({ responseStatus, clientResponseDate, rejectionNotes })
 */
export const ClientResponseModal = ({ open, onClose, onSubmit, round, openIssues = 0 }) => {
  const [form] = Form.useForm();
  const response = Form.useWatch("responseStatus", form);
  const { submit, submitting } = useSubmit(
    (values) =>
      onSubmit({
        responseStatus: values.responseStatus,
        clientResponseDate: values.clientResponseDate.format("DD/MM/YYYY"),
        rejectionNotes: values.responseStatus === "rejected" ? values.rejectionNotes.trim() : "",
      }),
    onClose,
    "Client ka jawab save ho gaya",
  );

  const approveBlocked = response === "approved" && openIssues > 0;

  return (
    <Modal open={open} onCancel={onClose} title={`${roundLabel(round?.roundNumber)} — Client ka Jawab`} footer={null} destroyOnHidden className="wot-modal">
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        requiredMark={false}
        initialValues={{ clientResponseDate: dayjs(), responseStatus: "approved" }}
      >
        <Form.Item name="responseStatus" label="Client ne kya kaha?">
          <Radio.Group className="wot-response-group">
            <Radio.Button value="approved" className="wot-response-btn wot-response-btn--approve">
              <CheckCircleOutlined /> Approved
            </Radio.Button>
            <Radio.Button value="rejected" className="wot-response-btn wot-response-btn--reject">
              <CloseCircleOutlined /> Reject
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {approveBlocked && (
          <Alert
            type="warning"
            showIcon
            className="wot-modal-alert"
            message={`${openIssues} problem(s) abhi jari hain. Approve se pehle unhe "Hal ho gayi" mark karein.`}
          />
        )}

        <Form.Item label="Jawab kis din aaya?" name="clientResponseDate" rules={[{ required: true, message: "Date chunein" }]}>
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" inputReadOnly disabledDate={notFuture(round?.sampleReadyDate)} />
        </Form.Item>

        {response === "rejected" && (
          <Form.Item
            label="Reject ki wajah"
            name="rejectionNotes"
            rules={[{ required: true, whitespace: true, message: "Reject ki wajah likhna zaroori hai" }]}
          >
            <Input.TextArea rows={3} maxLength={500} placeholder="e.g. Rang pasand nahi aaya, joints saaf nahi" />
          </Form.Item>
        )}

        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          danger={response === "rejected"}
          loading={submitting}
          disabled={approveBlocked}
        >
          {response === "rejected" ? "Reject Save Karein" : "Approve Save Karein"}
        </Button>
      </Form>
    </Modal>
  );
};
