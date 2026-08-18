import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, DatePicker, Button, Typography, Spin, Empty, Alert, Segmented } from "antd";
import { DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getWorkersListAsync } from "../store/services/dailyWorkService";
import { getSalarySlipAsync } from "../store/services/salarySlipService";
import companyLogo from "../../public/haroon-marbles-logo.png";
import employerSignature from "/public/signature.png";
import "./SalarySlip.css";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const DESIGNATION_LABEL = { mazdoor: "Mazdoor", qarigar: "Qarigar" };
const ATTENDANCE_LABEL = { present: "Present", absent: "Absent" };

const money = (v) => `Rs. ${Number(v || 0).toLocaleString()}`;

const PERIOD_OPTIONS = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Custom", value: "custom" },
];

const SalarySlip = () => {
  const dispatch = useDispatch();
  const { workersList = [] } = useSelector((state) => state.dailyWork || {});
  const { slip, status } = useSelector((state) => state.salarySlip || {});
  const loading = status === "loading";

  const [employerId, setEmployerId] = useState(undefined);
  const [periodType, setPeriodType] = useState("month");
  const [customRange, setCustomRange] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    dispatch(getWorkersListAsync());
  }, [dispatch]);

  const resolveRange = () => {
    if (periodType === "week") {
      return [dayjs().startOf("week"), dayjs().endOf("week")];
    }
    if (periodType === "month") {
      return [dayjs().startOf("month"), dayjs().endOf("month")];
    }
    return customRange && customRange.length === 2 ? customRange : null;
  };

  const handleGenerate = () => {
    if (!employerId) return;
    const range = resolveRange();
    if (!range) return;
    dispatch(
      getSalarySlipAsync({
        employerId,
        startDate: range[0].format("DD/MM/YYYY"),
        endDate: range[1].format("DD/MM/YYYY"),
      }),
    );
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || !slip) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const workerName = slip?.employer?.name?.replace(/\s+/g, "-") || "worker";
      pdf.save(`salary-slip-${workerName}-${dayjs().format("DD-MM-YYYY")}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="ssp-root">
      <div className="ssp-controls ssp-no-print">
        <Title level={3} className="ssp-title">
          Salary Slip
        </Title>
        <div className="ssp-controls-row">
          <Select
            showSearch
            allowClear
            className="ssp-control"
            placeholder="Select worker"
            optionFilterProp="label"
            value={employerId}
            onChange={setEmployerId}
            options={workersList.map((w) => ({
              value: w._id,
              label: `${w.name} (${DESIGNATION_LABEL[w.designation] || w.designation})`,
            }))}
          />
          <Segmented
            className="ssp-control"
            options={PERIOD_OPTIONS}
            value={periodType}
            onChange={setPeriodType}
          />
          {periodType === "custom" && (
            <RangePicker
              className="ssp-control"
              format="DD/MM/YYYY"
              value={customRange}
              onChange={setCustomRange}
            />
          )}
          <Button type="primary" className="ssp-control" onClick={handleGenerate} disabled={!employerId}>
            Generate Slip
          </Button>
        </div>
      </div>

      {status === "error" && (
        <Alert type="error" showIcon message="Salary slip nahi ban saka — dobara try karein." className="ssp-error ssp-no-print" />
      )}

      <Spin spinning={loading}>
        {slip ? (
          <>
            <div className="ssp-actions ssp-no-print">
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                Print
              </Button>
              <Button type="primary" icon={<DownloadOutlined />} loading={downloading} onClick={handleDownloadPdf}>
                Download PDF
              </Button>
            </div>

            <div className="ssp-sheet" ref={printRef}>
              <div className="ssp-sheet-header">
                <img src={companyLogo} alt="Haroon Marbles" className="ssp-logo" />
                <div className="ssp-company-info">
                  <div className="ssp-company-name">Haroon Marbles</div>
                  <div className="ssp-slip-label">Worker Salary Slip</div>
                </div>
              </div>

              <div className="ssp-divider" />

              <div className="ssp-meta-grid">
                <div>
                  <div className="ssp-meta-label">Worker Name</div>
                  <div className="ssp-meta-value">{slip.employer?.name}</div>
                </div>
                <div>
                  <div className="ssp-meta-label">Designation</div>
                  <div className="ssp-meta-value">
                    {DESIGNATION_LABEL[slip.employer?.designation] || slip.employer?.designation}
                  </div>
                </div>
                <div>
                  <div className="ssp-meta-label">Period</div>
                  <div className="ssp-meta-value">
                    {slip.period?.startDate} — {slip.period?.endDate}
                  </div>
                </div>
                <div>
                  <div className="ssp-meta-label">Generated On</div>
                  <div className="ssp-meta-value">{dayjs().format("DD MMM YYYY")}</div>
                </div>
              </div>

              <div className="ssp-summary-grid">
                <div className="ssp-summary-card">
                  <div className="ssp-summary-label">Present Days</div>
                  <div className="ssp-summary-value">{slip.presentDays}</div>
                </div>
                <div className="ssp-summary-card">
                  <div className="ssp-summary-label">Absent Days</div>
                  <div className="ssp-summary-value">{slip.absentDays}</div>
                </div>
                <div className="ssp-summary-card">
                  <div className="ssp-summary-label">Base Salary</div>
                  <div className="ssp-summary-value">{money(slip.totalBaseSalary)}</div>
                </div>
                <div className="ssp-summary-card">
                  <div className="ssp-summary-label">Overtime</div>
                  <div className="ssp-summary-value">
                    {slip.totalOvertimeHours || 0} hrs / {money(slip.totalOvertimeAmount)}
                  </div>
                </div>
                <div className="ssp-summary-card">
                  <div className="ssp-summary-label">Advance Taken</div>
                  <div className="ssp-summary-value">{money(slip.totalAdvance)}</div>
                </div>
                <div className="ssp-summary-card ssp-summary-card--highlight">
                  <div className="ssp-summary-label">Net Payable</div>
                  <div className="ssp-summary-value ssp-net-value">{money(slip.netSalary)}</div>
                </div>
              </div>

              <div className="ssp-section-title">Daily Records</div>
              {slip.entries && slip.entries.length > 0 ? (
                <table className="ssp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Site</th>
                      <th>Attendance</th>
                      <th>Salary</th>
                      <th>Overtime</th>
                      <th>Advance</th>
                      <th>Net Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slip.entries.map((e) => {
                      const net = (e.salary || 0) + (e.overtimeAmount || 0) - (e.advanceAmount || 0);
                    //   console.log("net", net, e.salary, e.overtimeAmount, e.advanceAmount);
                      return (
                        <tr key={e._id}>
                          <td>{e.entryDate}</td>
                          <td>{e.currentSite || "—"}</td>
                          <td>
                            <span className={`ssp-tag ssp-tag--${e.attendance}`}>
                              {ATTENDANCE_LABEL[e.attendance] || e.attendance}
                            </span>
                          </td>
                          <td>{money(e.salary)}</td>
                          <td>
                            {e.overtimeHours || 0} hrs / {money(e.overtimeAmount)}
                          </td>
                          <td>{money(e.advanceAmount)}</td>
                          <td className="ssp-net-cell">{money(net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <Empty description="Is period mein koi daily record nahi mila" className="ssp-no-print" />
              )}

              <div className="ssp-signatures">
                <div className="ssp-signature-block">
                  <img src={employerSignature} alt="Employer signature" className="ssp-signature-image" />
                  <div className="ssp-signature-line" />
                  <div className="ssp-signature-label">Employer Signature</div>
                </div>
                <div className="ssp-signature-block">
                  <div className="ssp-signature-line" />
                  <div className="ssp-signature-label">Worker Signature</div>
                </div>
              </div>

              <div className="ssp-footer-note">This is a computer-generated salary slip — Haroon Marbles</div>
            </div>
          </>
        ) : (
          !loading && (
            <Empty
              description="Worker aur period select karke 'Generate Slip' dabayein"
              className="ssp-empty-state ssp-no-print"
            />
          )
        )}
      </Spin>
    </div>
  );
};

export default SalarySlip;