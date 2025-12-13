import { CiCirclePlus } from "react-icons/ci";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Tag, Select, Button, Card, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { DownloadOutlined } from "@ant-design/icons";

import {
  fetchUsersThunk,
  updateUserStatusThunk,
  updateUserRoleThunk,
} from "../../../redux/slices/userSlice";
import useGlobalMessage from "../../../utils/hooks/useGlobalMessage";
import exportApi from "../../../../apis/exportApi";

const { Option } = Select;

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

  // State loading cho export
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

  // Logic export Users
  const handleExportUsers = async () => {
    try {
      setExportingUsers(true);
      messageApi.loading({
        content: "Đang xuất danh sách người dùng...",
        key: "exportUserMsg",
      });
      
      const response = await exportApi.exportUsers("csv");
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `users_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      messageApi.success({
        content: "Tải danh sách người dùng thành công!",
        key: "exportUserMsg",
      });
    } catch (error) {
      console.error(error);
      messageApi.error({
        content: "Lỗi xuất dữ liệu người dùng.",
        key: "exportUserMsg",
      });
    } finally {
      setExportingUsers(false);
    }
  };

  // Toggle Active <-> Locked (UI gọi “Blocked” nhưng DB dùng “Locked”)
  const toggleStatus = async (user) => {
    const newStatus = user.status === "Active" ? "Locked" : "Active";
    try {
      setRowLoadingId(user.user_id);
      await dispatch(
        updateUserStatusThunk({ userId: user.user_id, status: newStatus })
      ).unwrap();
      messageApi.success(
        newStatus === "Locked"
          ? "Đã khóa tài khoản người dùng"
          : "Đã mở khóa tài khoản người dùng"
      );
    } catch (err) {
      messageApi.error(err || "Không thể cập nhật trạng thái");
    } finally {
      setRowLoadingId(null);
    }
  };

  const makeManager = async (user) => {
    try {
      setRowLoadingId(user.user_id);
      await dispatch(
        updateUserRoleThunk({ userId: user.user_id, role_name: "Manager" })
      ).unwrap();
      messageApi.success("Đã cập nhật role user thành Manager");
    } catch (err) {
      messageApi.error(err || "Không thể cập nhật role");
    } finally {
      setRowLoadingId(null);
    }
  };

  const makeVolunteer = async (user) => {
    try {
      setRowLoadingId(user.user_id);
      await dispatch(
        updateUserRoleThunk({ userId: user.user_id, role_name: "Volunteer" })
      ).unwrap();
      messageApi.success("Đã cập nhật role user thành Volunteer");
    } catch (err) {
      messageApi.error(err || "Không thể cập nhật role");
    } finally {
      setRowLoadingId(null);
    }
  };

  const columns = [
    {
      title: "Họ tên",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role_name",
      key: "role_name",
      render: (role) => <Tag>{role}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const visibleStatus = status === "Locked" ? "Blocked" : status;
        return (
          <Tag color={visibleStatus === "Active" ? "green" : "red"}>
            {visibleStatus}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        const isSelf = currentUser?.user_id === record.user_id;

        return (
          <Space>
            <Button
              size="small"
              disabled={isSelf}
              danger
              loading={rowLoadingId === record.user_id}
              onClick={() => toggleStatus(record)}
            >
              {record.status === "Active" ? "Block" : "Unblock"}
            </Button>

            {record.role_name !== "Volunteer" && (
              <Button
                size="small"
                loading={rowLoadingId === record.user_id}
                disabled={isSelf}
                onClick={() => makeVolunteer(record)}
              >
                Make Volunteer
              </Button>
            )}

            {record.role_name !== "Manager" && (
              <Button
                size="small"
                loading={rowLoadingId === record.user_id}
                disabled={isSelf}
                onClick={() => makeManager(record)}
              >
                Make Manager
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const pag = admin.pagination || {};

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Card
        title="Users"
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
        bodyStyle={{ display: "flex", flexDirection: "column" }}
        extra={
          <Space>
            {/* Nút Export CSV */}
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportUsers}
              loading={exportingUsers}
            >
              Export CSV
            </Button>
            
            <div style={{ width: 1, height: 20, background: '#f0f0f0', margin: '0 8px' }} />

            <Button
              type="primary"
              onClick={() => navigate("/admin/users/create")}
            >
              Tạo tài khoản mới
            </Button>

            <span>Role:</span>
            <Select
              allowClear
              style={{ width: 140 }}
              placeholder="All"
              value={roleFilter}
              onChange={setRoleFilter}
            >
              <Option value="Volunteer">Volunteer</Option>
              <Option value="Manager">Manager</Option>
              <Option value="Admin">Admin</Option>
            </Select>

            <span>Status:</span>
            <Select
              allowClear
              style={{ width: 140 }}
              placeholder="All"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="Active">Active</Option>
              <Option value="Locked">Blocked</Option>
            </Select>
          </Space>
        }
      >
        <Table
          style={{ flex: 1 }}
          rowKey="user_id"
          loading={admin.loadingList}
          columns={columns}
          dataSource={admin.list}
          pagination={{
            current: pag.current_page || 1,
            pageSize,
            total: pag.total_records || 0,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default AdminUsers;