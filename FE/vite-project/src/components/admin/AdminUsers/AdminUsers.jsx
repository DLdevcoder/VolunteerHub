import "../../../../public/style/EventTableShared.css";
import "./AdminUsers.css";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Tag, Select, Button, Space, Typography, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import {
  DownloadOutlined,
  PlusOutlined,
  UserOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  UnlockOutlined,
  UserSwitchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import {
  CrownOutlined,
  SolutionOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import {
  fetchUsersThunk,
  updateUserStatusThunk,
  updateUserRoleThunk,
} from "../../../redux/slices/userSlice";
import useGlobalMessage from "../../../utils/hooks/useGlobalMessage";
import exportApi from "../../../../apis/exportApi";

const { Option } = Select;
const { Title, Text } = Typography;

const AdminUsers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const messageApi = useGlobalMessage();

  const admin = useSelector((state) => state.user.admin);
  const currentUser = useSelector((state) => state.auth.user);

  const [roleFilter, setRoleFilter] = useState();
  const [statusFilter, setStatusFilter] = useState();
  const [pageSize, setPageSize] = useState(10);
  const [rowLoadingId, setRowLoadingId] = useState(null);
  const [exportingUsers, setExportingUsers] = useState(false);

  const loadData = (page = 1, limit = pageSize) => {
    dispatch(
      fetchUsersThunk({
        page,
        limit,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      })
    );
  };

  useEffect(() => {
    loadData(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, roleFilter, statusFilter]);

  const handleTableChange = (pag) => {
    setPageSize(pag.pageSize);
    loadData(pag.current, pag.pageSize);
  };

  const handleExportUsers = async () => {
    try {
      setExportingUsers(true);
      messageApi.loading({
        content: "Đang xuất danh sách...",
        key: "exportUserMsg",
      });
      const response = await exportApi.exportUsers("csv");
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `users_report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      messageApi.success({ content: "Xuất thành công!", key: "exportUserMsg" });
    } catch (error) {
      console.error(error);
      messageApi.error({ content: "Lỗi xuất dữ liệu.", key: "exportUserMsg" });
    } finally {
      setExportingUsers(false);
    }
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === "Active" ? "Locked" : "Active";
    try {
      setRowLoadingId(user.user_id);
      await dispatch(
        updateUserStatusThunk({ userId: user.user_id, status: newStatus })
      ).unwrap();
      messageApi.success(
        newStatus === "Locked" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản"
      );
    } catch (err) {
      messageApi.error(err || "Không thể cập nhật trạng thái");
    } finally {
      setRowLoadingId(null);
    }
  };

  const changeRole = async (user, newRole) => {
    try {
      setRowLoadingId(user.user_id);
      await dispatch(
        updateUserRoleThunk({ userId: user.user_id, role_name: newRole })
      ).unwrap();
      messageApi.success(`Đã chuyển quyền thành ${newRole}`);
    } catch (err) {
      messageApi.error(err || "Không thể cập nhật quyền");
    } finally {
      setRowLoadingId(null);
    }
  };

  // Helper render role tag
  const renderRoleTag = (role) => {
    const map = {
      Admin: {
        color: "blue",
        icon: <CrownOutlined />,
        label: "Admin",
        cls: "role-pill role-admin",
      },
      Manager: {
        color: "cyan",
        icon: <SolutionOutlined />,
        label: "Manager",
        cls: "role-pill role-manager",
      },
      Volunteer: {
        color: "green",
        icon: <TeamOutlined />,
        label: "Volunteer",
        cls: "role-pill role-volunteer",
      },
    };

    const cfg = map[role] || {
      color: "default",
      icon: <TeamOutlined />,
      label: role,
      cls: "role-pill",
    };

    return (
      <Tag className={cfg.cls}>
        <span className="role-pill__inner">
          <span className="role-pill__icon">{cfg.icon}</span>
          <span className="role-pill__text">{cfg.label}</span>
        </span>
      </Tag>
    );
  };

  const columns = [
    {
      title: "Họ tên",
      dataIndex: "full_name",
      key: "full_name",
      render: (text) => (
        <span style={{ fontWeight: 600, color: "#333" }}>
          <UserOutlined style={{ marginRight: 8, color: "#3674B5" }} />
          {text}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => (
        <span style={{ color: "#555" }}>
          <MailOutlined style={{ marginRight: 8, color: "#888" }} />
          {text}
        </span>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role_name",
      key: "role_name",
      width: 120,
      align: "center",
      render: (role) => renderRoleTag(role),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status) => {
        const isLocked = status === "Locked";
        return (
          <Tag className="status-pill" color={isLocked ? "red" : "green"}>
            {isLocked ? "Blocked" : "Active"}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      align: "center",
      render: (_, record) => {
        const isSelf = currentUser?.user_id === record.user_id;
        const isLocked = record.status === "Locked";

        return (
          <Space>
            <Tooltip title={isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}>
              <Button
                size="small"
                disabled={isSelf}
                danger={!isLocked}
                type={isLocked ? "primary" : "default"} // Locked thì nút xanh để mở, Active thì nút đỏ để khóa
                className="btn-action-user"
                icon={isLocked ? <UnlockOutlined /> : <LockOutlined />}
                loading={rowLoadingId === record.user_id}
                onClick={() => toggleStatus(record)}
              />
            </Tooltip>

            {record.role_name !== "Manager" && (
              <Tooltip title="Đổi thành Manager">
                <Button
                  size="small"
                  icon={<UserSwitchOutlined />}
                  className="btn-action-user"
                  loading={rowLoadingId === record.user_id}
                  disabled={isSelf}
                  onClick={() => changeRole(record, "Manager")}
                >
                  Manager
                </Button>
              </Tooltip>
            )}

            {record.role_name !== "Volunteer" && (
              <Tooltip title="Đổi thành Volunteer">
                <Button
                  size="small"
                  className="btn-action-user"
                  loading={rowLoadingId === record.user_id}
                  disabled={isSelf}
                  onClick={() => changeRole(record, "Volunteer")}
                >
                  Volunteer
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const pag = admin.pagination || {};

  return (
    <div className="event-table-container">
      {/* HEADER */}
      <div className="event-table-header" style={{ display: "block" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={3} style={{ color: "#3674B5", margin: 0 }}>
              Quản lý người dùng
            </Title>
          </div>

          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportUsers}
              loading={exportingUsers}
              style={{ borderRadius: 6, background: "#3674B5", color: "#fff" }}
            >
              Export CSV
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/admin/users/create")}
              style={{ background: "#3674B5", borderRadius: 6 }}
            >
              Tạo mới
            </Button>
          </Space>
        </div>

        {/* FILTER BAR */}
        <div className="admin-users-filter">
          <div className="filter-group">
            <SafetyCertificateOutlined style={{ color: "#888" }} />
            <span className="filter-label">Vai trò:</span>
            <Select
              allowClear
              style={{ width: 140 }}
              placeholder="Tất cả"
              value={roleFilter}
              onChange={setRoleFilter}
            >
              <Option value="Volunteer">Volunteer</Option>
              <Option value="Manager">Manager</Option>
              <Option value="Admin">Admin</Option>
            </Select>
          </div>

          <div className="filter-group">
            <FilterOutlined style={{ color: "#888" }} />
            <span className="filter-label">Trạng thái:</span>
            <Select
              allowClear
              style={{ width: 140 }}
              placeholder="Tất cả"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="Active">Active</Option>
              <Option value="Locked">Blocked</Option>
            </Select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <Table
        className="shared-event-table"
        rowKey="user_id"
        loading={admin.loadingList}
        columns={columns}
        dataSource={admin.list}
        pagination={{
          current: pag.current_page || 1,
          pageSize,
          total: pag.total_records || 0,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default AdminUsers;
