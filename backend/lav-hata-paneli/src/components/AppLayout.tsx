// RENK REHBERİ
// Ana Koyu: #232545, #181533
// Ana Pembe: #fe0094
// Mor: #a13b97, #ac47a4, #e9b7e4
// Beyaz: #fff
// Açık Gri: #f7f8fa, #ece3ee

import React, { useState, useEffect, useMemo, type ReactNode, useCallback } from "react";
import {
  Layout, Menu, Avatar, Dropdown, Tooltip, Badge, Button, Input,
  Breadcrumb, Drawer, List, Spin,
} from "antd";
import {
  UserOutlined, LogoutOutlined, SettingOutlined, MenuUnfoldOutlined, MenuFoldOutlined,
  BellOutlined, HomeOutlined, AppstoreOutlined, FileTextOutlined, TeamOutlined,
  SkinOutlined, SearchOutlined, MailOutlined, ExclamationCircleOutlined, GlobalOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Announcements from "./Announcements";
import lavLogo from "../assets/lav-logo.png"; // LOGONU BURADAN İMPORT ET

const DESKTOP_BREAKPOINT = 900;
const DARK_BG = "#181533";
const LIGHT_BG = "#f7f8fa";

const LANGUAGES = [
  { key: "tr", name: "Türkçe" },
  { key: "en", name: "English" },
  { key: "de", name: "Deutsch" },
];
const THEMES = [
  { key: "light", label: "Açık", icon: <SkinOutlined /> },
  { key: "dark", label: "Koyu", icon: <SkinOutlined /> },
];

const breadcrumbNames = {
  "/": "Ana Sayfa",
  "/equipment": "Ekipmanlar",
  "/general-faults": "Arıza Defteri",
  "/downtimes": "Duruşlar",
  "/users": "Kullanıcılar",
  "/settings": "Ayarlar",
  "/admin": "Admin Panel",
} as const;

type RouteKey = keyof typeof breadcrumbNames;
const getBreadcrumbName = (key: string): string => {
  return breadcrumbNames[key as RouteKey] ?? key.charAt(0).toUpperCase() + key.slice(1);
};

const { Sider, Content, Header, Footer } = Layout;

const AppLayout: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const nav = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(window.innerWidth < DESKTOP_BREAKPOINT);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(localStorage.getItem("lang") || "tr");
  const [sidebarMobile, setSidebarMobile] = useState(false);

  const [userInfo, setUserInfo] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const [searchDrawer, setSearchDrawer] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const handleResize = () =>
      setCollapsed(window.innerWidth < DESKTOP_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setLoadingUser(true);
    const userRaw = localStorage.getItem("userInfo");
    if (userRaw) {
      setUserInfo(JSON.parse(userRaw));
      setLoadingUser(false);
    } else {
      setUserInfo({ name: "Kullanıcı", role: "user", email: "test@site.com" });
      setLoadingUser(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    setNotifications([
      {
        id: 1,
        title: "Yeni Arıza Kaydı",
        description: "A101 Motorunda yüksek sıcaklık algılandı.",
        datetime: "13:05",
        read: false,
        icon: <ExclamationCircleOutlined style={{ color: "#fe0094" }} />,
      },
      {
        id: 2,
        title: "Bakım Hatırlatıcısı",
        description: "Sürücü S-01 için 10 gün içinde bakım gerekiyor.",
        datetime: "09:45",
        read: false,
        icon: <MailOutlined style={{ color: "#2e2d55" }} />,
      },
      {
        id: 3,
        title: "Yazılım Güncellemesi",
        description: "Versiyon 2.7.5 yayınlandı.",
        datetime: "Dün",
        read: true,
        icon: <SettingOutlined style={{ color: "#a13b97" }} />,
      },
    ]);
  }, []);

 const menuItems = useMemo(
  () => [
    { key: "/", icon: <HomeOutlined />, label: "Ana Sayfa" },
    { key: "/equipment", icon: <AppstoreOutlined />, label: "Ekipmanlar" },
    { key: "/general-faults", icon: <FileTextOutlined />, label: "Arıza Defteri" },
    { key: "/downtimes", icon: <FieldTimeOutlined />, label: "Duruşlar" },
    { key: "/users", icon: <TeamOutlined />, label: "Kullanıcılar" },
    { key: "/stocks", icon: <SkinOutlined />, label: "Stoklar" },   // <-- BURAYA EKLENDİ
    { key: "/settings", icon: <SettingOutlined />, label: "Profil" },
    ...(userInfo && userInfo.role === "admin"
      ? [{ key: "/admin", icon: <SettingOutlined />, label: "Admin Panel" }]
      : []),
    { key: "/logout", icon: <LogoutOutlined />, label: "Çıkış" },
  ],
  [userInfo]
);

  const handleMenu = useCallback(
    ({ key }: { key: string }) => {
      if (key === "/logout") {
        localStorage.clear();
        nav("/login");
      } else {
        nav(key);
      }
      setSidebarMobile(false);
    },
    [nav]
  );

  const userMenu = (
    <Menu>
      <Menu.Item
        key="profile"
        icon={<UserOutlined />}
        onClick={() => nav("/settings")}
      >
        Profilim
      </Menu.Item>
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        onClick={() => {
          localStorage.clear();
          nav("/login");
        }}
      >
        Çıkış Yap
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  // --- Breadcrumb ---
  const breadcrumbs = useMemo(() => {
    const paths = location.pathname.split("/").filter(Boolean);
    let built = "";
    return [
      <Breadcrumb.Item key="home" onClick={() => nav("/")}>
        Ana Sayfa
      </Breadcrumb.Item>,
      ...paths.map((p) => {
        built += "/" + p;
        return (
          <Breadcrumb.Item key={built} onClick={() => nav(built)}>
            {getBreadcrumbName("" + p)}
          </Breadcrumb.Item>
        );
      }),
    ];
  }, [location.pathname, nav]);

  const notifCount = notifications.filter((n) => !n.read).length;
  const isDark = theme === "dark";
  const sidebarBg = isDark
    ? "linear-gradient(180deg,#181533 80%,#2e2d55 160%)"
    : "linear-gradient(180deg,#232545 70%,#e9b7e4 180%)";
  const mainBg = isDark ? DARK_BG : LIGHT_BG;

  const showSidebar = () => setSidebarMobile(true);
  const hideSidebar = () => setSidebarMobile(false);

  const menuBtnStyle = {
    color: "#fff",
    background: "rgba(249, 243, 243, 0.09)",
    border: "none",
    fontSize: 22,
    marginRight: 14,
  };

  // type hatası olmasın diye:
  const pathKey = (() => {
    const main = location.pathname.split("/")[1];
    return (main ? "/" + main : "/") as RouteKey;
  })();
  const pageTitle = getBreadcrumbName(pathKey);

  useEffect(() => {
    document.body.className = isDark ? "dark-theme" : "";
  }, [isDark]);

  return (
    <Layout
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: mainBg,
        transition: "background 0.3s",
      }}
      className={isDark ? "dark-theme" : ""}
    >
      {/* === SIDEBAR (desktop) === */}
      <Sider
        collapsible
        collapsed={collapsed}
        width={240}
        theme="dark"
        breakpoint="lg"
        onBreakpoint={setCollapsed}
        trigger={null}
        style={{
          background: sidebarBg,
          boxShadow: "2px 0 32px #ac47a433",
          minHeight: "100vh",
          zIndex: 20,
          position: "relative",
        }}
        className="main-sidebar"
      >
        <div
  style={{
    margin: collapsed ? "30px 0" : "42px 0 48px 0",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: collapsed ? 60 : 50, // logo alanı daha yüksek ve tam ortalı
    transition: "all 0.3s",
  }}
>
  <img
    src={lavLogo}
    alt="LAV Logo"
    style={{
      height: collapsed ? 48 : 70,  // büyütülmüş logo
      width: "auto",
      display: "block",
      filter: "drop-shadow(0 2px 8px #18153360)",
      transition: "all 0.3s cubic-bezier(.45,.15,.38,1.04)",
    }}
  />
</div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenu}
          style={{
            fontSize: 17,
            fontWeight: 500,
            background: "transparent",
            color: "#fff",
            marginTop: 8,
            borderRight: "none",
          }}
        />
      </Sider>

      {/* === SIDEBAR (Mobile Drawer) === */}
      <Drawer
        placement="left"
        width={230}
        open={sidebarMobile}
        onClose={hideSidebar}
        bodyStyle={{ padding: 0, background: "#232545" }}
        closeIcon={false}
        zIndex={1200}
      >
        <div
          style={{
            margin: "22px 0 18px 18px",
            fontSize: 20,
            fontWeight: 900,
            color: "#fff",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src={lavLogo}
            alt="LAV Logo"
            style={{
              height: 33,
              width: "auto",
              display: "block",
              filter: "drop-shadow(0 1px 6px #18153344)",
              marginRight: 8,
            }}
          />
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(k) => {
            handleMenu(k);
            hideSidebar();
          }}
          style={{
            fontSize: 16,
            fontWeight: 500,
            background: "transparent",
            color: "#fff",
            marginTop: 6,
          }}
        />
      </Drawer>

      {/* === MAIN === */}
      <Layout
        style={{
          background: mainBg,
          minHeight: "100vh",
          width: "100%",
          overflowX: "hidden",
          padding: 0,
          position: "relative",
        }}
      >
        {/* === HEADER === */}
        <Header
          style={{
            height: 70,
            background: isDark
              ? "linear-gradient(90deg, #232545 0%, #3a2858 120%)"
              : "linear-gradient(90deg,#fff 0%, #f7e3fa 60%, #ac47a4 100%)",
            display: "flex",
            alignItems: "center",
            padding: "0 34px 0 20px",
            boxShadow: "0 2px 12px #e9b7e4",
            zIndex: 200,
            position: "sticky",
            top: 0,
          }}
        >
          <Button
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((c) => !c)}
            style={{
              ...menuBtnStyle,
              display: window.innerWidth < DESKTOP_BREAKPOINT ? "none" : "inline-block",
            }}
            size="large"
          />
          <Button
            icon={<MenuUnfoldOutlined />}
            style={{
              ...menuBtnStyle,
              display: window.innerWidth >= DESKTOP_BREAKPOINT ? "none" : "inline-block",
            }}
            size="large"
            onClick={showSidebar}
          />
          <span
            style={{
              color: "#fdf9fdff",
              fontWeight: 700,
              fontSize: 25,
              letterSpacing: 1,
              marginRight: 28,
              textShadow: "0 2px 6px #fff2",
              userSelect: "none",
              fontFamily: "'Montserrat', 'Segoe UI'",
            }}
          >
            LAV Kontrol Paneli
          </span>
          <div style={{ flex: 1, minWidth: 18 }} />
          {/* === Breadcrumb === */}
          <div style={{ marginRight: 24, minWidth: 200 }}>
            <Breadcrumb
              separator=">"
              style={{ fontWeight: 500, fontSize: 17, color: "#39224f" }}
            >
              {breadcrumbs}
            </Breadcrumb>
          </div>
          {/* === Bildirimler === */}
          <Tooltip title="Bildirimler">
            <Badge count={notifCount}>
              <Button
                shape="circle"
                icon={<BellOutlined />}
                size="large"
                style={{
                  marginRight: 10,
                  background: "#fff",
                  color: "#fe0094",
                  boxShadow: "0 2px 8px #c7b8d8",
                  fontSize: 20,
                }}
                onClick={() => setNotifOpen(true)}
              />
            </Badge>
          </Tooltip>
          {/* === Dil seçimi === */}
          <Dropdown
            overlay={
              <Menu>
                {LANGUAGES.map((l) => (
                  <Menu.Item key={l.key} onClick={() => setLanguage(l.key)}>
                    {l.name}
                  </Menu.Item>
                ))}
              </Menu>
            }
            trigger={["click"]}
          >
            <Button
              shape="circle"
              icon={<GlobalOutlined />}
              style={{ marginRight: 8, fontSize: 18, color: "#6d538c" }}
            />
          </Dropdown>
          {/* === Tema seçimi === */}
          <Dropdown
            overlay={
              <Menu>
                {THEMES.map((t) => (
                  <Menu.Item key={t.key} onClick={() => setTheme(t.key)}>
                    {t.icon} {t.label}
                  </Menu.Item>
                ))}
              </Menu>
            }
            trigger={["click"]}
          >
            <Button
              shape="circle"
              icon={<SkinOutlined />}
              style={{ marginRight: 8, fontSize: 18, color: "#6d538c" }}
            />
          </Dropdown>
          {/* === Kullanıcı === */}
          <Dropdown overlay={userMenu} placement="bottomRight" arrow>
            <Avatar
              size={42}
              style={{
                background: isDark
                  ? "linear-gradient(135deg, #2e2d55 65%, #a13b97 120%)"
                  : "linear-gradient(135deg, #ac47a4 65%, #e9b7e4 120%)",
                color: "#fff",
                fontWeight: 600,
                marginLeft: 8,
                boxShadow: "0 2px 8px #ac47a44a",
              }}
              icon={<UserOutlined />}
            />
          </Dropdown>
        </Header>

        {/* === NOTIFICATION DRAWER === */}
        <Drawer
          title={
            <span>
              <BellOutlined style={{ color: "#ac47a4" }} /> Bildirimler
            </span>
          }
          placement="right"
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          width={380}
          zIndex={2001}
        >
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={item.icon}
                  title={
                    <span style={{ fontWeight: item.read ? 400 : 700 }}>
                      {item.title}
                    </span>
                  }
                  description={
                    <span style={{ color: "#434", fontSize: 15 }}>
                      {item.description}
                    </span>
                  }
                />
                <span
                  style={{ fontSize: 13, color: "#a0a", marginLeft: 10 }}
                >
                  {item.datetime}
                </span>
              </List.Item>
            )}
          />
        </Drawer>

        {/* === SEARCH DRAWER === */}
        <Drawer
          title={
            <span>
              <SearchOutlined style={{ color: "#ac47a4" }} /> Arama
            </span>
          }
          placement="top"
          open={searchDrawer}
          onClose={() => setSearchDrawer(false)}
          height={150}
        >
          <Input.Search
            placeholder="Panelde ara..."
            enterButton="Ara"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={(v) => alert(`Arama: ${v}`)}
            size="large"
            style={{ width: "100%" }}
          />
        </Drawer>

        {/* === ANA İÇERİK === */}
        <Content
          className="main-content"
          style={{
            minHeight: "calc(100vh - 80px)",
            width: "100%",
            background: "transparent",
            padding: "0",
            margin: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            overflowX: "hidden",
          }}
        >
          <div
            className="dashboard-content"
            style={{
              maxWidth: 1360,
              margin: "32px auto 0 auto",
              padding: "36px 22px 28px 22px",
              background: "#fff",
              borderRadius: 32,
              minHeight: 540,
              boxShadow: "0 8px 32px #b486be1a, 0 1.5px 9px #e9b7e420",
            }}
          >
            
            {/* Ana içerik */}
            <div style={{ width: "100%" }}>
              {loadingUser ? (
                <div style={{ textAlign: "center", marginTop: 48 }}>
                  <Spin size="large" />
                </div>
              ) : (
                children || <Outlet />
              )}
            </div>
          </div>
        </Content>

        {/* === FOOTER === */}
        <Footer
          style={{
            textAlign: "center",
            color: "#aaa",
            background: "transparent",
            fontSize: 16,
            marginTop: 8,
            userSelect: "none",
            letterSpacing: 0.5,
          }}
        >
          © {new Date().getFullYear()} LAV Hata Paneli | Powered by Zekayi
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
