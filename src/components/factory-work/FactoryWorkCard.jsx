import React from "react";
import {
  Button,
  Card,
  Divider,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from "antd";

import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString()}`;

const FactoryWorkCard = ({
  data,
  onDelete,
  deleteLoading,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      size="small"
      className="overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Title
            level={5}
            ellipsis
            className="!mb-1"
          >
            {data.factoryName}
          </Title>

          <Text type="secondary">
            {data.workMaterialName}
          </Text>
        </div>

        <Tag color="processing">
          {data.status?.replaceAll("_", " ")}
        </Tag>
      </div>

      <Divider className="!my-3" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Text type="secondary">Quantity</Text>
          <div>
            <Text strong>{data.quantity || "-"}</Text>
          </div>
        </div>

        <div>
          <Text type="secondary">Total</Text>
          <div>
            <Text strong>
              {money(data.totalAmount)}
            </Text>
          </div>
        </div>

        <div>
          <Text type="secondary">Paid</Text>
          <div>
            <Text strong>
              {money(data.totalPaid)}
            </Text>
          </div>
        </div>

        <div>
          <Text type="secondary">Remaining</Text>
          <div>
            <Text strong>
              {money(data.remainingAmount)}
            </Text>
          </div>
        </div>
      </div>

      <Divider className="!my-3" />

      <div className="flex gap-2">
        <Button
          icon={<EyeOutlined />}
          onClick={() =>
            navigate(`/factory-work/${data._id}`)
          }
          className="flex-1"
        >
          View
        </Button>

        <Button
          icon={<EditOutlined />}
          onClick={() =>
            navigate(`/factory-work/${data._id}/edit`)
          }
        />

        <Popconfirm
          title="Delete this factory work?"
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{
            danger: true,
            loading: deleteLoading,
          }}
          onConfirm={() => onDelete(data._id)}
        >
          <Button
            danger
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      </div>
    </Card>
  );
};

export default FactoryWorkCard;