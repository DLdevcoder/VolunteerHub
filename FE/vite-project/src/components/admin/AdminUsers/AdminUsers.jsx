import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Tag, Select, Button, Card, Space, message } from "antd";
import {
  fetchUsersThunk,
  updateUserStatusThunk,
  updateUserRoleThunk,
} from "../../../redux/slices/userSlice";

const { Option } = Select;

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { admin } = useSelector((state) => state.user);
  const currentUser = useSelector((state) => state.auth.user);

  const [roleFilter, setRoleFilter] = useState();
  const [statusFilter, setStatusFilter] = useState();
  const [pageSize, setPageSize] = useState(10);
  const [rowLoadingId, setRowLoadingId] = useState(null);

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

  const toggleStatus = async (user) => {
    const newStatus = user.status === "Active" ? "Blocked" : "Active";
    try {
      setRowLoadingId(user.user_id);
      await dispatch(
        updateUserStatusThunk({ userId: user.user_id, status: newStatus })
      ).unwrap();
      message.success("Cập nhật trạng thái thành công");
    } catch (err) {
      message.error(err || "Không thể cập nhật trạng thái");
    } finally {
      setRowLoadingId(null);
    }
  };

  const makeAdmin = async (user) => {
    try {
      setRowLoadingId(user.user_id);
      await dispatch(
        updateUserRoleThunk({ userId: user.user_id, role_name: "Admin" })
      ).unwrap();
      message.success("Đã nâng quyền user thành Admin");
    } catch (err) {
      message.error(err || "Không thể cập nhật role");
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
      message.success("Đã cập nhật role user thành Manager");
    } catch (err) {
      message.error(err || "Không thể cập nhật role");
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
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
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

            {record.role_name !== "Admin" && (
              <Button
                size="small"
                type="primary"
                disabled={isSelf}
                loading={rowLoadingId === record.user_id}
                onClick={() => makeAdmin(record)}
              >
                Make Admin
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
              <Option value="Blocked">Blocked</Option>
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
