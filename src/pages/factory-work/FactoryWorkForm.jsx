import React, { useEffect } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Typography,
  message,
} from "antd";

import { ArrowLeftOutlined } from "@ant-design/icons";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

import {
  createFactoryWorkAsync,
  updateFactoryWorkAsync,
  getSingleFactoryWorkAsync,
} from "../../store/services/factoryWorkService";

const { Title, Text } = Typography;
const { TextArea } = Input;

const FactoryWorkForm = () => {
  const [form] = Form.useForm();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workId } = useParams();

  const isEdit = Boolean(workId);

  const {
    singleFactoryWork,
    create_status,
    update_status,
    getSingle_status,
  } = useSelector((state) => state.factoryWork);

  useEffect(() => {
    if (isEdit) {
      dispatch(getSingleFactoryWorkAsync(workId));
    }
  }, [dispatch, isEdit, workId]);

  useEffect(() => {
    if (isEdit && singleFactoryWork) {
      form.setFieldsValue({
        factoryName:
          singleFactoryWork.factoryName,

        workMaterialName:
          singleFactoryWork.workMaterialName,

        quantity:
          singleFactoryWork.quantity,

        totalAmount:
          singleFactoryWork.totalAmount,

        expectedCompletionDate:
          singleFactoryWork.expectedCompletionDate
            ? dayjs(
                singleFactoryWork.expectedCompletionDate
              )
            : null,

        notes:
          singleFactoryWork.notes,
      });
    }
  }, [singleFactoryWork, isEdit, form]);

  const handleSubmit = async (values) => {
    try {
      const payload = {
        factoryName: values.factoryName,
        workMaterialName: values.workMaterialName,
        quantity: values.quantity,
        totalAmount: values.totalAmount,
        expectedCompletionDate:
          values.expectedCompletionDate
            ?.format("YYYY-MM-DD"),
        notes: values.notes,
      };

      if (isEdit) {
        await dispatch(
          updateFactoryWorkAsync({
            id: workId,
            ...payload,
          })
        ).unwrap();

        message.success(
          "Factory work updated successfully."
        );

        navigate(`/factory-work/${workId}`);
      } else {
        const result = await dispatch(
          createFactoryWorkAsync(payload)
        ).unwrap();

        message.success(
          "Factory work created successfully."
        );

        const id =
          result?.factoryWork?._id;

        if (id) {
          navigate(`/factory-work/${id}`);
        } else {
          navigate("/factory-work");
        }
      }
    } catch (error) {
      message.error(
        error || "Something went wrong."
      );
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mb-5">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>

      <div className="mb-5">
        <Title level={3} className="!mb-1">
          {isEdit
            ? "Edit Factory Work"
            : "Add Factory Work"}
        </Title>

        <Text type="secondary">
          Add the basic information about the material
          you are getting from the factory.
        </Text>
      </div>

      <Card loading={isEdit && getSingle_status === "loading"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Factory Name"
                name="factoryName"
                rules={[
                  {
                    required: true,
                    message:
                      "Please enter factory name.",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g. ABC Marble Factory"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Material Name"
                name="workMaterialName"
                rules={[
                  {
                    required: true,
                    message:
                      "Please enter material name.",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g. Marble"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Quantity"
                name="quantity"
              >
                <Input
                  size="large"
                  placeholder="e.g. 1000 sq.ft"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Total Factory Amount"
                name="totalAmount"
                rules={[
                  {
                    required: true,
                    message:
                      "Please enter total amount.",
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  className="w-full"
                  min={0}
                  formatter={(value) =>
                    `Rs. ${value}`.replace(
                      /\B(?=(\d{3})+(?!\d))/g,
                      ","
                    )
                  }
                  parser={(value) =>
                    value?.replace(/Rs.\s?|(,*)/g, "")
                  }
                  placeholder="Enter total amount"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Expected Completion Date"
                name="expectedCompletionDate"
              >
                <DatePicker
                  size="large"
                  className="w-full"
                  format="DD MMM YYYY"
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Notes"
                name="notes"
              >
                <TextArea
                  rows={4}
                  placeholder="Any important details..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              size="large"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>

            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={
                create_status === "loading" ||
                update_status === "loading"
              }
            >
              {isEdit
                ? "Save Changes"
                : "Create Factory Work"}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default FactoryWorkForm;