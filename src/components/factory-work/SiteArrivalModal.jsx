import React, { useEffect } from "react";
import {
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
} from "antd";

import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import {
  updateSiteArrivalAsync,
} from "../../store/services/factoryWorkService";

const SiteArrivalModal = ({
  open,
  workId,
  data,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { arrival_status } = useSelector(
    (state) => state.factoryWork
  );

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        arrivalDate:
          data?.arrivalDate
            ? dayjs(data.arrivalDate)
            : dayjs(),

        materialChecked:
          data?.materialChecked ||
          "received",

        notes: data?.notes || "",
      });
    }
  }, [open, data, form]);

  const submit = async (values) => {
    try {
      await dispatch(
        updateSiteArrivalAsync({
          id: workId,
          arrivalDate:
            values.arrivalDate.format(
              "YYYY-MM-DD"
            ),
          materialChecked:
            values.materialChecked,
          notes: values.notes,
        })
      ).unwrap();

      onSuccess?.();
      onClose();
    } catch (error) {}
  };

  return (
    <Modal
      title="Site Arrival"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Save Arrival"
      confirmLoading={
        arrival_status === "loading"
      }
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
      >
        <Form.Item
          label="Site Par Maal Aya"
          name="arrivalDate"
          rules={[
            {
              required: true,
              message: "Please select date.",
            },
          ]}
        >
          <DatePicker
            size="large"
            className="w-full"
            format="DD MMM YYYY"
          />
        </Form.Item>

        <Form.Item
          label="Material Check"
          name="materialChecked"
          rules={[
            {
              required: true,
              message:
                "Please select material status.",
            },
          ]}
        >
          <Select
            size="large"
            className="w-full"
            options={[
              {
                label: "Received",
                value: "received",
              },
              {
                label: "Checked - Everything OK",
                value: "checked",
              },
              {
                label: "Issue Found",
                value: "issue_found",
              },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Notes"
          name="notes"
        >
          <Input.TextArea
            rows={3}
            placeholder="e.g. All pieces intact, quality good"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SiteArrivalModal;