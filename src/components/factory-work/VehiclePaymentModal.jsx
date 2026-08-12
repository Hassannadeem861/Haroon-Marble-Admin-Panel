import React, { useEffect } from "react";
import {
  DatePicker,
  Form,
  InputNumber,
  Modal,
} from "antd";

import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import {
  addVehiclePaymentAsync,
} from "../../store/services/factoryWorkService.js";

const VehiclePaymentModal = ({
  open,
  workId,
  remainingAmount,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { vehiclePayment_status } =
    useSelector(
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
        addVehiclePaymentAsync({
          id: workId,
          amount: values.amount,
          type: "payment",
          date: values.date.format(
            "YYYY-MM-DD"
          ),
        })
      ).unwrap();

      onSuccess?.();
      onClose();
    } catch (error) {}
  };

  return (
    <Modal
      title="Vehicle Final Payment"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Save Payment"
      confirmLoading={
        vehiclePayment_status ===
        "loading"
      }
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
      >
        <Form.Item
          label="Payment Amount"
          name="amount"
          rules={[
            {
              required: true,
              message:
                "Please enter payment amount.",
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
            min={1}
            className="w-full"
            placeholder="Enter amount"
          />
        </Form.Item>

        <Form.Item
          label="Payment Date"
          name="date"
          rules={[
            {
              required: true,
              message:
                "Please select date.",
            },
          ]}
        >
          <DatePicker
            size="large"
            className="w-full"
            format="DD MMM YYYY"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default VehiclePaymentModal;