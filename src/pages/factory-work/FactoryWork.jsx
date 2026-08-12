import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  getFactoryWorksAsync,
  deleteFactoryWorkAsync,
} from "../../store/services/factoryWorkService";

import FactoryWorkTable from "../../components/factory-work/FactoryWorkTable.jsx";
import FactoryWorkCard from "../../components/factory-work/FactoryWorkCard.jsx";

const { Title, Text } = Typography;

const FactoryWork = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    factoryWorks = [],
    get_status,
    delete_status,
  } = useSelector((state) => state.factoryWork);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    dispatch(getFactoryWorksAsync());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getFactoryWorksAsync());
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteFactoryWorkAsync(id)).unwrap();

      message.success("Factory work deleted successfully.");
    } catch (error) {
      message.error(error || "Failed to delete factory work.");
    }
  };

  const filteredWorks = factoryWorks.filter((item) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      item.factoryName?.toLowerCase().includes(searchText) ||
      item.workMaterialName?.toLowerCase().includes(searchText);

    const matchesStatus =
      status === "all" || item.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} className="!mb-1">
            Factory Work
          </Title>

          <Text type="secondary">
            Manage factory material, payments, transport and site delivery.
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate("/factory-work/create")}
          block
          className="md:!w-auto"
        >
          Add Factory Work
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-5">
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={24} md={14} lg={16}>
            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search factory or material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>

          <Col xs={20} sm={20} md={7} lg={6}>
            <Select
              size="large"
              className="w-full"
              value={status}
              onChange={setStatus}
              options={[
                { label: "All Status", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "In Factory", value: "in_factory" },
                { label: "Ready", value: "ready" },
                { label: "On The Way", value: "on_the_way" },
                { label: "Received", value: "received" },
                { label: "Checked", value: "checked" },
                { label: "Completed", value: "completed" },
              ]}
            />
          </Col>

          <Col xs={4} sm={4} md={3} lg={2}>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={get_status === "loading"}
              className="w-full"
            />
          </Col>
        </Row>
      </Card>

      {/* Loading */}
      {get_status === "loading" && factoryWorks.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      ) : filteredWorks.length === 0 ? (
        <Card>
          <Empty
            description={
              search || status !== "all"
                ? "No factory work found."
                : "No factory work added yet."
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop / Tablet */}
          <div className="hidden md:block">
            <FactoryWorkTable
              data={filteredWorks}
              onDelete={handleDelete}
              deleteLoading={delete_status === "loading"}
            />
          </div>

          {/* Mobile */}
          <div className="block md:hidden">
            <div className="flex flex-col gap-3">
              {filteredWorks.map((item) => (
                <FactoryWorkCard
                  key={item._id}
                  data={item}
                  onDelete={handleDelete}
                  deleteLoading={delete_status === "loading"}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FactoryWork;