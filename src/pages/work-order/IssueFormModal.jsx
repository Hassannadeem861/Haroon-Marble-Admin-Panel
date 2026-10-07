import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Modal, Form, DatePicker, Input, Radio, Button, Image, Spin } from "antd";
import { CameraOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { createSiteIssueAsync, updateSiteIssueAsync } from "../../store/services/workOrderService.js";
import { compressImage, ALLOWED_IMAGE_TYPES } from "../../utils/compressImage.js";
import { getErrorMessage } from "../../utils/toastError.js";
import { CAUSED_BY_OPTIONS, REASON_CHIPS, MAX_ISSUE_IMAGES } from "./workOrderConstants.js";

/**
 * Problem add / edit — date, wajah, kis ki wajah se, aur photos (max 5).
 * Photos select hote hi browser mein compress hoti hain, aur "Save" par
 * text + photos ek hi request mein jati hain.
 */
const IssueFormModal = ({ open, onClose, onSaved, workOrderId, round, issue }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const fileInputRef = useRef(null);
  const [newPhotos, setNewPhotos] = useState([]); // [{ id, file, preview }]
  const [removedIds, setRemovedIds] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!issue;
  const roundStart = round?.sampleStartDate ? dayjs(round.sampleStartDate, "DD/MM/YYYY") : null;
  const keptImages = (issue?.images || []).filter((img) => !removedIds.includes(img._id));
  const totalPhotos = keptImages.length + newPhotos.length;

  // Preview URLs ka hisaab ref mein — modal band / component hat-te waqt memory se hatao.
  const photosRef = useRef([]);
  photosRef.current = newPhotos;
  const revokeAllPreviews = () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
  useEffect(() => revokeAllPreviews, []);

  useEffect(() => {
    revokeAllPreviews();
    setRemovedIds([]);
    setNewPhotos([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, issue?._id]);

  // destroyOnHidden — har dafa khulne par form naya mount hota hai, is liye initialValues kaafi hain.
  const initialValues = {
    issueDate: issue?.issueDate ? dayjs(issue.issueDate, "DD/MM/YYYY") : dayjs(),
    description: issue?.description || "",
    causedBy: issue?.causedBy || "client",
  };

  const addReasonChip = (text) => {
    const current = form.getFieldValue("description")?.trim();
    form.setFieldsValue({ description: current ? `${current}. ${text}` : text });
    form.validateFields(["description"]).catch(() => {});
  };

  const handleFilesSelected = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // same photo dobara select ho sake
    if (picked.length === 0) return;

    const space = MAX_ISSUE_IMAGES - totalPhotos;
    if (space <= 0) {
      toast.error(`Zyada se zyada ${MAX_ISSUE_IMAGES} photos lag sakti hain.`);
      return;
    }
    if (picked.length > space) toast.error(`Sirf ${space} aur photo(s) lag sakti hain — baaki chhor di gayin.`);

    setCompressing(true);
    try {
      const results = await Promise.allSettled(picked.slice(0, space).map((file) => compressImage(file)));
      const ready = [];
      results.forEach((r) => {
        if (r.status === "fulfilled" && ALLOWED_IMAGE_TYPES.includes(r.value.type)) {
          ready.push({ id: `${Date.now()}-${Math.random()}`, file: r.value, preview: URL.createObjectURL(r.value) });
        }
      });
      if (ready.length < results.length) toast.error("Kuch photos khul nahi sakin. JPG, PNG ya WEBP photo lagayen.");
      setNewPhotos((prev) => [...prev, ...ready]);
    } finally {
      setCompressing(false);
    }
  };

  const removeNewPhoto = (id) => {
    setNewPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        issueDate: values.issueDate.format("DD/MM/YYYY"),
        description: values.description.trim(),
        causedBy: values.causedBy,
        images: newPhotos.map((p) => p.file),
      };
      if (isEdit) {
        await dispatch(updateSiteIssueAsync({ id: issue._id, ...payload, removeImageIds: removedIds })).unwrap();
      } else {
        await dispatch(createSiteIssueAsync({ ...payload, workOrderId, roundId: round._id })).unwrap();
      }
      toast.success(isEdit ? "Problem update ho gayi" : "Problem save ho gayi");
      onSaved?.();
      onClose();
    } catch (err) {
      const message = getErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={submitting ? undefined : onClose}
      title={isEdit ? "Problem Edit Karein" : "Problem Report Karein"}
      footer={null}
      destroyOnHidden
      maskClosable={!submitting}
      className="wot-modal"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} initialValues={initialValues}>
        <Form.Item label="Problem kis din aayi?" name="issueDate" rules={[{ required: true, message: "Date chunein" }]}>
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            inputReadOnly
            disabledDate={(d) => d && (d > dayjs().endOf("day") || (roundStart && d < roundStart.startOf("day")))}
          />
        </Form.Item>

        <Form.Item label="Kya problem hai? (wajah)" required>
          <div className="wot-chips">
            {REASON_CHIPS.map((chip) => (
              <button type="button" key={chip} className="wot-chip" onClick={() => addReasonChip(chip)}>
                + {chip}
              </button>
            ))}
          </div>
          <Form.Item name="description" noStyle rules={[{ required: true, whitespace: true, message: "Problem ki wajah likhein" }]}>
            <Input.TextArea rows={3} maxLength={1000} placeholder="e.g. Client ne tiles 3 din late di" />
          </Form.Item>
        </Form.Item>

        <Form.Item label="Kis ki wajah se?" name="causedBy">
          <Radio.Group optionType="button" buttonStyle="solid" options={CAUSED_BY_OPTIONS} className="wot-radio-wrap" />
        </Form.Item>

        <Form.Item label={`Photos (${totalPhotos}/${MAX_ISSUE_IMAGES}) — optional`}>
          <Spin spinning={compressing} tip="Photo tayyar ho rahi hai…">
            <div className="wot-photo-grid">
              <Image.PreviewGroup>
                {keptImages.map((img) => (
                  <div className="wot-photo" key={img._id}>
                    <Image src={img.url} alt="Problem photo" crossOrigin="anonymous" />
                    <button
                      type="button"
                      className="wot-photo-remove"
                      aria-label="Photo hatayen"
                      onClick={() => setRemovedIds((prev) => [...prev, img._id])}
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                ))}
                {newPhotos.map((p) => (
                  <div className="wot-photo" key={p.id}>
                    <Image src={p.preview} alt="Nayi photo" />
                    <button type="button" className="wot-photo-remove" aria-label="Photo hatayen" onClick={() => removeNewPhoto(p.id)}>
                      <CloseOutlined />
                    </button>
                  </div>
                ))}
              </Image.PreviewGroup>

              {totalPhotos < MAX_ISSUE_IMAGES && (
                <button type="button" className="wot-photo-add" onClick={() => fileInputRef.current?.click()}>
                  <CameraOutlined />
                  <span>Photo lein</span>
                </button>
              )}
            </div>
          </Spin>
          {/* accept="image/*" — mobile par camera aur gallery dono ka option aata hai */}
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFilesSelected} />
        </Form.Item>

        <Button type="primary" htmlType="submit" block size="large" loading={submitting} disabled={compressing}>
          {submitting ? (newPhotos.length ? "Photos upload ho rahi hain…" : "Save ho raha hai…") : "Save Karein"}
        </Button>
      </Form>
    </Modal>
  );
};

export default IssueFormModal;
