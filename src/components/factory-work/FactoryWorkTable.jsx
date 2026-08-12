import React from "react";
import {
  Button,
  Card,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";

const { Text } = Typography;

const statusConfig = {
  pending: {
    label: "Pending",
    color: "default",
  },
  in_factory: {
    label: "In Factory",
    color: "processing",
  },
  ready: {
    label: "Ready",
    color: "blue",
  },
  on_the_way: {
    label: "On The Way",
    color: "orange",
  },
  received: {
    label: "Received",
    color: "cyan",
  },
  checked: {
    label: "Checked",
    color: "green",
  },
  completed: {
    label: "Completed",
    color: "success",
  },
};

const paymentConfig = {
  unpaid: {
    label: "Unpaid",
    color: "red",
  },
  partially_paid: {
    label: "Partially Paid",
    color: "orange",
  },
  fully_paid: {
    label: "Fully Paid",
    color: "green",
  },
};

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString()}`;

const FactoryWorkTable = ({
  data,
  onDelete,
  deleteLoading,
}) => {
  const navigate = useNavigate();

  const columns = [
    {
      title: "Factory",
      dataIndex: "factoryName",
      key: "factoryName",
      render: (value, record) => (
        <div>
          <Text strong>{value}</Text>

          <div>
            <Text type="secondary">
              {record.workMaterialName}
            </Text>
          </div>
        </div>
      ),
    },

    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },

    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => (
        <Text strong>{money(value)}</Text>
      ),
    },

    {
      title: "Paid",
      key: "paid",
      render: (_, record) => money(record.totalPaid),
    },

    {
      title: "Remaining",
      key: "remaining",
      render: (_, record) => money(record.remainingAmount),
    },

    {
      title: "Payment",
      key: "paymentStatus",
      render: (_, record) => {
        const config =
          paymentConfig[record.paymentStatus] ||
          paymentConfig.unpaid;

        return (
          <Tag color={config.color}>
            {config.label}
          </Tag>
        );
      },
    },

    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const config =
          statusConfig[record.status] ||
          statusConfig.pending;

        return (
          <Tag color={config.color}>
            {config.label}
          </Tag>
        );
      },
    },

    {
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() =>
              navigate(`/factory-work/${record._id}`)
            }
          />

          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`/factory-work/${record._id}/edit`)
            }
          />

          <Popconfirm
            title="Delete this factory work?"
            description="This record will be removed."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{
              danger: true,
              loading: deleteLoading,
            }}
            onConfirm={() => onDelete(record._id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card bodyStyle={{ padding: 0 }}>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={data}
        scroll={{ x: 1100 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
      />
    </Card>
  );
};

export default FactoryWorkTable;