import React, {
  useState,
  useEffect,
  useMemo,
  type ReactNode,
  useCallback,
} from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Tooltip,
  Badge,
  Button,
  Input,
  Breadcrumb,
  Drawer,
  List,
  Switch,
  Spin,
  Space,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  HomeOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  TeamOutlined,
  SkinOutlined,
  SearchOutlined,
  MailOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  DownOutlined,
  FieldTimeOutlined,        // <--- YENİ! 
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Announcements from "./Announcements";

const DESKTOP_BREAKPOINT = 900; // px
const DARK_BG = "#1d1833";
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

// --------- Breadcrumb'a Duruşlar eklendi! ---------
const breadcrumbNames: { [key: string]: string } = {
  "/": "Dashboard",
  "/equipment": "Ekipmanlar",
  "/general-faults": "Arıza Defteri",
  "/downtimes": "Duruşlar",     // <--- EKLENDİ
  "/users": "Kullanıcılar",
  "/settings": "Ayarlar",
  "/admin": "Admin Panel",
};

const { Sider, Content, Header, Footer } = Layout;

const AppLayout: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const nav = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(window.innerWidth < DESKTOP_BREAKPOINT);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );
  const [language, setLanguage] = useState(
    localStorage.getItem("lang") || "tr"
  );
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
        icon: <ExclamationCircleOutlined style={{ color: "#b80070" }} />,
      },
      {
        id: 2,
        title: "Bakım Hatırlatıcısı",
        description: "Sürücü S-01 için 10 gün içinde bakım gerekiyor.",
        datetime: "09:45",
        read: false,
        icon: <MailOutlined style={{ color: "#00bfff" }} />,
      },
      {
        id: 3,
        title: "Yazılım Güncellemesi",
        description: "Versiyon 2.7.5 yayınlandı.",
        datetime: "Dün",
        read: true,
        icon: <SettingOutlined style={{ color: "#a060e9" }} />,
      },
    ]);
  }, []);

  // -------- Menüye Duruşlar eklendi! --------
  const menuItems = useMemo(
    () => [
      { key: "/", icon: <HomeOutlined />, label: "Dashboard" },
      { key: "/equipment", icon: <AppstoreOutlined />, label: "Ekipmanlar" },
      { key: "/general-faults", icon: <FileTextOutlined />, label: "Arıza Defteri" },
      { key: "/downtimes", icon: <FieldTimeOutlined />, label: "Duruşlar" }, // <--- YENİ!
      { key: "/users", icon: <TeamOutlined />, label: "Kullanıcılar" },
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
        Dashboard
      </Breadcrumb.Item>,
      ...paths.map((p) => {
        built += "/" + p;
        return (
          <Breadcrumb.Item key={built} onClick={() => nav(built)}>
            {breadcrumbNames["/" + p] ||
              p.charAt(0).toUpperCase() + p.slice(1)}
          </Breadcrumb.Item>
        );
      }),
    ];
  }, [location.pathname, nav]);

  const notifCount = notifications.filter((n) => !n.read).length;
  const isDark = theme === "dark";
  const sidebarBg = isDark
    ? "linear-gradient(180deg,#181533 80%,#4c3758 160%)"
    : "linear-gradient(180deg,#232545 70%,#e9b7e4 180%)";
  const mainBg = isDark ? DARK_BG : LIGHT_BG;

  const showSidebar = () => setSidebarMobile(true);
  const hideSidebar = () => setSidebarMobile(false);

  const menuBtnStyle = {
    color: "#fff",
    background: "rgba(255,255,255,0.09)",
    border: "none",
    fontSize: 22,
    marginRight: 14,
  };

  const pageTitle =
    breadcrumbNames[location.pathname.split("/")[1]
      ? "/" + location.pathname.split("/")[1]
      : "/"
    ] || "Panel";

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
            margin: "28px 0 36px 0",
            paddingLeft: collapsed ? 0 : 30,
            fontSize: collapsed ? 18 : 27,
            fontWeight: 900,
            letterSpacing: 1,
            color: "#fff",
            textShadow: "0 2px 10px #ac47a430",
            fontFamily: "'Montserrat', 'Segoe UI', Arial",
          }}
        >
          <span style={{ letterSpacing: 1 }}>LAV</span>
          {!collapsed && (
            <span
              style={{
                fontWeight: 400,
                fontSize: 15,
                marginLeft: 8,
                opacity: 0.73,
              }}
            >
              hata paneli
            </span>
          )}
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
          }}
        >
          LAV{" "}
          <span
            style={{ fontWeight: 400, fontSize: 13, marginLeft: 8, opacity: 0.7 }}
          >
            hata paneli
          </span>
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
              ? "linear-gradient(90deg,#1d1833 0%,#60408c 120%)"
              : "linear-gradient(90deg,#ac47a4 0%,#e9b7e4 120%)",
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
              color: "#fff",
              fontWeight: 700,
              fontSize: 21,
              letterSpacing: 1,
              marginRight: 28,
              textShadow: "0 2px 6px #d86ec66a",
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
              style={{ fontWeight: 500, fontSize: 15, color: "#fff" }}
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
                  color: "#ac47a4",
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
              style={{ marginRight: 8, fontSize: 18 }}
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
              style={{ marginRight: 8, fontSize: 18 }}
            />
          </Dropdown>
          {/* === Kullanıcı === */}
          <Dropdown overlay={userMenu} placement="bottomRight" arrow>
            <Avatar
              size={42}
              style={{
                background: isDark
                  ? "linear-gradient(135deg,#60408c 65%,#e9b7e4 120%)"
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
            {/* DUYURULAR sadece dashboard'da */}
            {location.pathname === "/" && <Announcements />}
            {/* === Başlık ve ana içerik === */}
            <h1
              style={{
                fontWeight: 700,
                fontSize: 32,
                marginBottom: 0,
                color: "#2b154b",
                letterSpacing: 1,
              }}
            >
              {pageTitle}
            </h1>
            <hr
              style={{
                border: "none",
                borderTop: "1.5px solid #ece3ee",
                margin: "16px 0 24px 0",
              }}
            />
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
