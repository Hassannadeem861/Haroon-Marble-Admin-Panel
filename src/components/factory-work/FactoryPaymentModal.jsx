import React, { useEffect } from "react";
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
} from "antd";

import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import {
  addFactoryPaymentAsync,
} from "../../store/services/factoryWorkService";

const FactoryPaymentModal = ({
  open,
  workId,
  remainingAmount,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { payment_status } = useSelector(
    (state) => state.factoryWork
  );

  useEffect(() => {
    if (open) {
      form.resetFields();

      form.setFieldsValue({
        date: dayjs(),
      });
    }
  }, [open, form]);

  const submit = async (values) => {
    try {
      await dispatch(
        addFactoryPaymentAsync({
          id: workId,
          amount: values.amount,
          type: "payment",
          date: values.date.format("YYYY-MM-DD"),
          note: values.note,
        })
      ).unwrap();

      onSuccess?.();
      onClose();
      form.resetFields();
    } catch (error) {
      // parent can show redux error
    }
  };

  return (
    <Modal
      title="Add Factory Payment"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Save Payment"
      confirmLoading={payment_status === "loading"}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
      >
        <Form.Item
          label="Amount"
          name="amount"
          rules={[
            {
              required: true,
              message: "Please enter amount.",
            },
            {
              validator: (_, value) => {
                if (
                  value &&
                  remainingAmount !== undefined &&
                  value > remainingAmount
                ) {
                  return Promise.reject(
                    new Error(
                      `Remaining amount is Rs. ${Number(
                        remainingAmount
                      ).toLocaleString()}`
                    )
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            size="large"
            className="w-full"
            min={1}
            placeholder="Enter payment amount"
          />
        </Form.Item>

        <Form.Item
          label="Payment Date"
          name="date"
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
          label="Note"
          name="note"
        >
          <Input.TextArea
            rows={3}
            placeholder="e.g. Final payment after checking material"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FactoryPaymentModal;