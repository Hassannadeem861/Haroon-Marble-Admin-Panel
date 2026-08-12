import React, { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Row,
  Space,
  Spin,
  Statistic,
  Steps,
  Tag,
  Timeline,
  Typography,
  message,
} from "antd";

import {
  ArrowLeftOutlined,
  CarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileDoneOutlined,
  HomeOutlined,
  PlusOutlined,
  SendOutlined,
  TruckOutlined,
} from "@ant-design/icons";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
  getSingleFactoryWorkAsync,
} from "../../store/services/factoryWorkService";

import FactoryPaymentModal from "../../components/factory-work/FactoryPaymentModal.jsx";
import MaterialMovementModal from "../../components/factory-work/MaterialMovementModal.jsx";
import SiteArrivalModal from "../../components/factory-work/SiteArrivalModal.jsx";
import VehicleModal from "../../components/factory-work/VehicleModal.jsx";
import VehiclePaymentModal from "../../components/factory-work/VehiclePaymentModal.jsx";

const { Title, Text } = Typography;

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString()}`;

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const FactoryWorkDetails = () => {
  const { workId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [factoryPaymentOpen, setFactoryPaymentOpen] =
    useState(false);

  const [movementOpen, setMovementOpen] =
    useState(false);

  const [arrivalOpen, setArrivalOpen] =
    useState(false);

  const [vehicleOpen, setVehicleOpen] =
    useState(false);

  const [vehiclePaymentOpen, setVehiclePaymentOpen] =
    useState(false);

  const {
    singleFactoryWork,
    getSingle_status,
  } = useSelector(
    (state) => state.factoryWork
  );

  const work = singleFactoryWork;

  useEffect(() => {
    if (workId) {
      dispatch(
        getSingleFactoryWorkAsync(workId)
      );
    }
  }, [dispatch, workId]);

  const refresh = () => {
    dispatch(
      getSingleFactoryWorkAsync(workId)
    );
  };

  if (
    getSingle_status === "loading" &&
    !work
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="p-4">
        <Empty description="Factory work not found." />
      </div>
    );
  }

  const materialMovement =
    work.materialMovement || {};

  const siteArrival =
    work.siteArrival || {};

  const vehicle =
    work.vehicle || null;

  const factoryFullyPaid =
    work.paymentStatus === "fully_paid";

  const vehicleFullyPaid =
    vehicle?.paymentStatus ===
    "fully_paid";

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/factory-work")}
          />

          <div>
            <Title
              level={3}
              className="!mb-1"
            >
              Factory Work
            </Title>

            <Text type="secondary">
              {work.factoryName}
            </Text>
          </div>
        </div>

        <Button
          icon={<EditOutlined />}
          onClick={() =>
            navigate(
              `/factory-work/${work._id}/edit`
            )
          }
        >
          Edit
        </Button>
      </div>

      {/* Basic Information */}
      <Card
        title="Work Information"
        className="mb-4"
      >
        <Descriptions
          column={{
            xs: 1,
            sm: 2,
            lg: 3,
          }}
          bordered
        >
          <Descriptions.Item label="Factory">
            {work.factoryName}
          </Descriptions.Item>

          <Descriptions.Item label="Material">
            {work.workMaterialName}
          </Descriptions.Item>

          <Descriptions.Item label="Quantity">
            {work.quantity || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Expected Completion">
            {formatDate(
              work.expectedCompletionDate
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            <Tag color="processing">
              {work.status?.replaceAll(
                "_",
                " "
              )}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Notes">
            {work.notes || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Payment Overview */}
      <Card
        title="Factory Payment"
        extra={
          !factoryFullyPaid && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                setFactoryPaymentOpen(true)
              }
            >
              Add Payment
            </Button>
          )
        }
        className="mb-4"
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Total Amount"
                value={work.totalAmount || 0}
                prefix="Rs."
                precision={0}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Paid"
                value={work.totalPaid || 0}
                prefix="Rs."
                precision={0}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Remaining"
                value={
                  work.remainingAmount || 0
                }
                prefix="Rs."
                precision={0}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {work.payments?.length ? (
          <Timeline
            items={work.payments.map(
              (payment) => ({
                color:
                  payment.type ===
                  "advance"
                    ? "blue"
                    : "green",

                children: (
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Text strong>
                        {money(
                          payment.amount
                        )}
                      </Text>

                      <Tag>
                        {payment.type ===
                        "advance"
                          ? "Advance"
                          : "Payment"}
                      </Tag>
                    </div>

                    <Text type="secondary">
                      {formatDate(
                        payment.date
                      )}
                    </Text>

                    {payment.note && (
                      <div>
                        <Text type="secondary">
                          {payment.note}
                        </Text>
                      </div>
                    )}
                  </div>
                ),
              })
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No payments recorded."
          />
        )}
      </Card>

      {/* Work Progress */}
      <Card
        title="Material Progress"
        className="mb-4"
      >
        <Steps
          current={
            work.status === "pending"
              ? 0
              : work.status === "on_the_way"
              ? 2
              : work.status === "received"
              ? 3
              : work.status === "checked"
              ? 4
              : work.status === "completed"
              ? 4
              : 1
          }
          responsive
          items={[
            {
              title: "Factory Work",
              icon: <HomeOutlined />,
            },
            {
              title: "Ready",
              icon: <FileDoneOutlined />,
            },
            {
              title: "On The Way",
              icon: <TruckOutlined />,
            },
            {
              title: "Site Arrival",
              icon: (
                <EnvironmentOutlined />
              ),
            },
            {
              title: "Checked",
              icon: (
                <CheckCircleOutlined />
              ),
            },
          ]}
        />
      </Card>

      {/* Factory Movement */}
      <Card
        title="Factory Se Maal Nikla"
        extra={
          <Button
            icon={<SendOutlined />}
            onClick={() =>
              setMovementOpen(true)
            }
          >
            {materialMovement.leftFactoryDate
              ? "Update"
              : "Add Details"}
          </Button>
        }
        className="mb-4"
      >
        {materialMovement.leftFactoryDate ? (
          <Descriptions
            column={{
              xs: 1,
              sm: 2,
            }}
          >
            <Descriptions.Item label="Factory Se Nikla">
              {formatDate(
                materialMovement.leftFactoryDate
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Vehicle">
              {materialMovement.vehicleUsed ||
                "-"}
            </Descriptions.Item>

            <Descriptions.Item
              label="Notes"
              span={2}
            >
              {materialMovement.notes ||
                "-"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Alert
            message="Material movement not recorded yet."
            description="Add the date when material left the factory."
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* Vehicle */}
      <Card
        title="Vehicle / Transport"
        extra={
          <Button
            icon={<CarOutlined />}
            onClick={() =>
              setVehicleOpen(true)
            }
          >
            {vehicle
              ? "Update Vehicle"
              : "Add Vehicle"}
          </Button>
        }
        className="mb-4"
      >
        {!vehicle ? (
          <Alert
            message="Vehicle details not added."
            description="Add transport details to keep the vehicle rent and payment record."
            type="info"
            showIcon
          />
        ) : (
          <>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title="Vehicle"
                    value={
                      vehicle.vehicleType ||
                      "-"
                    }
                  />
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title="Total Rent"
                    value={
                      vehicle.totalRent ||
                      0
                    }
                    prefix="Rs."
                    precision={0}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title="Remaining"
                    value={
                      vehicle.remainingAmount ||
                      0
                    }
                    prefix="Rs."
                    precision={0}
                  />
                </Card>
              </Col>
            </Row>

            <Divider />

            <Descriptions
              column={{
                xs: 1,
                sm: 2,
              }}
            >
              <Descriptions.Item label="Pickup Date">
                {formatDate(
                  vehicle.pickupDate
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Arrival Date">
                {formatDate(
                  vehicle.arrivalDate
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Paid">
                {money(
                  vehicle.totalPaid
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Payment Status">
                <Tag
                  color={
                    vehicle.paymentStatus ===
                    "fully_paid"
                      ? "green"
                      : "orange"
                  }
                >
                  {vehicle.paymentStatus?.replaceAll(
                    "_",
                    " "
                  )}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {!vehicleFullyPaid && (
              <div className="mt-4">
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={() =>
                    setVehiclePaymentOpen(
                      true
                    )
                  }
                >
                  Add Vehicle Payment
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Site Arrival */}
      <Card
        title="Site Arrival & Material Check"
        extra={
          <Button
            icon={
              <EnvironmentOutlined />
            }
            onClick={() =>
              setArrivalOpen(true)
            }
          >
            {siteArrival.arrivalDate
              ? "Update"
              : "Add Arrival"}
          </Button>
        }
        className="mb-4"
      >
        {siteArrival.arrivalDate ? (
          <Descriptions
            column={{
              xs: 1,
              sm: 2,
            }}
          >
            <Descriptions.Item label="Site Par Aya">
              {formatDate(
                siteArrival.arrivalDate
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Material Check">
              {siteArrival.materialChecked ===
              "checked" ? (
                <Tag color="green">
                  Checked - OK
                </Tag>
              ) : siteArrival.materialChecked ===
                "issue_found" ? (
                <Tag color="red">
                  Issue Found
                </Tag>
              ) : (
                <Tag color="blue">
                  Received
                </Tag>
              )}
            </Descriptions.Item>

            <Descriptions.Item
              label="Notes"
              span={2}
            >
              {siteArrival.notes ||
                "-"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Alert
            message="Site arrival not recorded yet."
            description="Add the date when material reached the site and check its condition."
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* Final Status */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text type="secondary">
              Current Work Status
            </Text>

            <div className="mt-1">
              <Tag
                color={
                  work.status ===
                  "completed"
                    ? "green"
                    : "processing"
                }
              >
                {work.status?.replaceAll(
                  "_",
                  " "
                )}
              </Tag>
            </div>
          </div>

          <div>
            <Text type="secondary">
              Factory Payment
            </Text>

            <div className="mt-1">
              {factoryFullyPaid ? (
                <Tag color="green">
                  Fully Paid
                </Tag>
              ) : (
                <Tag color="orange">
                  {
                    work.paymentStatus?.replaceAll(
                      "_",
                      " "
                    )
                  }
                </Tag>
              )}
            </div>
          </div>

          {vehicle && (
            <div>
              <Text type="secondary">
                Vehicle Payment
              </Text>

              <div className="mt-1">
                {vehicleFullyPaid ? (
                  <Tag color="green">
                    Fully Paid
                  </Tag>
                ) : (
                  <Tag color="orange">
                    {
                      vehicle.paymentStatus?.replaceAll(
                        "_",
                        " "
                      )
                    }
                  </Tag>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modals */}

      <FactoryPaymentModal
        open={factoryPaymentOpen}
        workId={work._id}
        remainingAmount={
          work.remainingAmount
        }
        onClose={() =>
          setFactoryPaymentOpen(false)
        }
        onSuccess={refresh}
      />

      <MaterialMovementModal
        open={movementOpen}
        workId={work._id}
        data={materialMovement}
        onClose={() =>
          setMovementOpen(false)
        }
        onSuccess={refresh}
      />

      <SiteArrivalModal
        open={arrivalOpen}
        workId={work._id}
        data={siteArrival}
        onClose={() =>
          setArrivalOpen(false)
        }
        onSuccess={refresh}
      />

      <VehicleModal
        open={vehicleOpen}
        workId={work._id}
        vehicle={vehicle}
        onClose={() =>
          setVehicleOpen(false)
        }
        onSuccess={refresh}
      />

      <VehiclePaymentModal
        open={vehiclePaymentOpen}
        workId={work._id}
        remainingAmount={
          vehicle?.remainingAmount || 0
        }
        onClose={() =>
          setVehiclePaymentOpen(false)
        }
        onSuccess={refresh}
      />
    </div>
  );
};

export default FactoryWorkDetails;