import React, { useEffect } from "react";
import {
  DatePicker,
  Form,
  Input,
  Modal,
} from "antd";

import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import {
  updateMaterialMovementAsync,
} from "../../store/services/factoryWorkService";

const MaterialMovementModal = ({
  open,
  workId,
  data,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { movement_status } = useSelector(
    (state) => state.factoryWork
  );

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        leftFactoryDate:
          data?.leftFactoryDate
            ? dayjs(data.leftFactoryDate)
            : dayjs(),

        vehicleUsed:
          data?.vehicleUsed || "",

        notes:
          data?.notes || "",
      });
    }
  }, [open, data, form]);

  const submit = async (values) => {
    try {
      await dispatch(
        updateMaterialMovementAsync({
          id: workId,
          leftFactoryDate:
            values.leftFactoryDate.format(
              "YYYY-MM-DD"
            ),
          vehicleUsed: values.vehicleUsed,
          notes: values.notes,
        })
      ).unwrap();

      onSuccess?.();
      onClose();
    } catch (error) {}
  };

  return (
    <Modal
      title="Factory Se Maal Nikla"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Save Details"
      confirmLoading={
        movement_status === "loading"
      }
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
      >
        <Form.Item
          label="Factory Se Maal Nikla"
          name="leftFactoryDate"
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
          label="Vehicle Used"
          name="vehicleUsed"
        >
          <Input
            size="large"
            placeholder="e.g. Suzuki"
          />
        </Form.Item>

        <Form.Item
          label="Notes"
          name="notes"
        >
          <Input.TextArea
            rows={3}
            placeholder="Any transport/movement details..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MaterialMovementModal;