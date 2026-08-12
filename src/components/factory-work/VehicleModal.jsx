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
  setVehicleInfoAsync,
} from "../../store/services/factoryWorkService";

const VehicleModal = ({
  open,
  workId,
  vehicle,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { vehicle_status } = useSelector(
    (state) => state.factoryWork
  );

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        vehicleType:
          vehicle?.vehicleType || "",

        totalRent:
          vehicle?.totalRent || undefined,

        pickupDate:
          vehicle?.pickupDate
            ? dayjs(vehicle.pickupDate)
            : dayjs(),

        arrivalDate:
          vehicle?.arrivalDate
            ? dayjs(vehicle.arrivalDate)
            : null,

        advanceAmount:
          vehicle?.payments?.find(
            (p) => p.type === "advance"
          )?.amount || undefined,

        advanceDate:
          vehicle?.payments?.find(
            (p) => p.type === "advance"
          )?.date
            ? dayjs(
                vehicle.payments.find(
                  (p) => p.type === "advance"
                ).date
              )
            : dayjs(),
      });
    }
  }, [open, vehicle, form]);

  const submit = async (values) => {
    try {
      await dispatch(
        setVehicleInfoAsync({
          id: workId,
          vehicleType: values.vehicleType,
          totalRent: values.totalRent,
          advanceAmount:
            values.advanceAmount || 0,
          advanceDate:
            values.advanceDate?.format(
              "YYYY-MM-DD"
            ),
          pickupDate:
            values.pickupDate?.format(
              "YYYY-MM-DD"
            ),
          arrivalDate:
            values.arrivalDate?.format(
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
      title="Vehicle / Transport Details"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Save Vehicle"
      confirmLoading={
        vehicle_status === "loading"
      }
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
      >
        <Form.Item
          label="Vehicle Type"
          name="vehicleType"
          rules={[
            {
              required: true,
              message:
                "Please enter vehicle type.",
            },
          ]}
        >
          <Input
            size="large"
            placeholder="e.g. Suzuki"
          />
        </Form.Item>

        <Form.Item
          label="Total Vehicle Rent"
          name="totalRent"
          rules={[
            {
              required: true,
              message:
                "Please enter total rent.",
            },
          ]}
        >
          <InputNumber
            size="large"
            min={0}
            className="w-full"
            placeholder="Enter total rent"
          />
        </Form.Item>

        <Form.Item
          label="Advance Amount"
          name="advanceAmount"
        >
          <InputNumber
            size="large"
            min={0}
            className="w-full"
            placeholder="Enter advance"
          />
        </Form.Item>

        <Form.Item
          label="Advance Date"
          name="advanceDate"
        >
          <DatePicker
            size="large"
            className="w-full"
            format="DD MMM YYYY"
          />
        </Form.Item>

        <Form.Item
          label="Pickup Date"
          name="pickupDate"
        >
          <DatePicker
            size="large"
            className="w-full"
            format="DD MMM YYYY"
          />
        </Form.Item>

        <Form.Item
          label="Expected Arrival Date"
          name="arrivalDate"
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

export default VehicleModal;