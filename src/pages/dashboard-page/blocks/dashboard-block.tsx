import {
  TrendingUp,
  Package,
  Truck,
  FileText,
  ArrowRight,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileBarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

// Sample data for the dashboard
const recentContracts = [
  {
    id: "001-2024",
    crop: "Пшеница",
    sender: "ООО Агрохолдинг",
    receiver: "ЗАО ЗерноТрейд",
    volume: 1200,
    date: "15.03.2024",
    status: "active",
    progress: 65,
  },
  {
    id: "002-2024",
    crop: "Подсолнечник",
    sender: "АО СельхозПром",
    receiver: "ООО МаслоЭкспорт",
    volume: 850,
    date: "12.03.2024",
    status: "active",
    progress: 42,
  },
  {
    id: "003-2024",
    crop: "Кукуруза",
    sender: "ООО ЮгАгро",
    receiver: "ЗАО ЗерноТрейд",
    volume: 950,
    date: "10.03.2024",
    status: "completed",
    progress: 100,
  },
  {
    id: "004-2024",
    crop: "Ячмень",
    sender: "КФХ Колос",
    receiver: "ООО БалтЭкспорт",
    volume: 750,
    date: "05.03.2024",
    status: "active",
    progress: 78,
  },
  {
    id: "005-2024",
    crop: "Рапс",
    sender: "АО АгроИнвест",
    receiver: "ООО МаслоЭкспорт",
    volume: 600,
    date: "01.03.2024",
    status: "completed",
    progress: 100,
  },
];

const recentActivities = [
  {
    id: 1,
    action: "Добавлен новый вагон",
    contract: "001-2024",
    user: "Иванов А.П.",
    timestamp: "Сегодня, 14:32",
  },
  {
    id: 2,
    action: "Загружен документ 'Паспорт качества №123'",
    contract: "001-2024",
    user: "Петрова Е.С.",
    timestamp: "��егодня, 12:15",
  },
  {
    id: 3,
    action: "Изменен статус вагона на 'Отгружен'",
    contract: "002-2024",
    user: "Сидоров И.В.",
    timestamp: "Сегодня, 10:45",
  },
  {
    id: 4,
    action: "Создан новый контракт",
    contract: "005-2024",
    user: "Иванов А.П.",
    timestamp: "Вчера, 16:20",
  },
  {
    id: 5,
    action: "Завершена отгрузка по контракту",
    contract: "003-2024",
    user: "Петрова Е.С.",
    timestamp: "Вчера, 14:05",
  },
];

// Status badge mapping
const statusBadge = {
  active: { label: "Активен", variant: "default" },
  completed: { label: "Завершен", variant: "success" },
  pending: { label: "Ожидает", variant: "warning" },
};
export const DashboardBlock = () => {
  // Calculate summary statistics
  const totalContracts = recentContracts.length;
  const activeContracts = recentContracts.filter(
    (c) => c.status === "active"
  ).length;
  const completedContracts = recentContracts.filter(
    (c) => c.status === "completed"
  ).length;

  const totalVolume = recentContracts.reduce(
    (sum, contract) => sum + contract.volume,
    0
  );
  const shippedVolume = recentContracts.reduce(
    (sum, contract) => sum + (contract.volume * contract.progress) / 100,
    0
  );
  const remainingVolume = totalVolume - shippedVolume;

  const shippingProgress = (shippedVolume / totalVolume) * 100;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Панель управления
          </h1>
          <p className="text-muted-foreground">Обзор контрактов и отгрузок</p>
        </div>
        <Button asChild>
          <Link to="/admin/contracts">
            Все контракты
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего контрактов
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              Активных: {activeContracts}, Завершенных: {completedContracts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий объем</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVolume.toLocaleString()} т
            </div>
            <p className="text-xs text-muted-foreground">
              Отгружено: {Math.round(shippedVolume).toLocaleString()} т
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Прогресс отгрузки
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(shippingProgress)}%
            </div>
            <Progress value={shippingProgress} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Остаток отгрузки
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(remainingVolume).toLocaleString()} т
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((remainingVolume / totalVolume) * 100)}% от общего
              объема
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Контракты</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Последние контракты</CardTitle>
              <CardDescription>
                Обзор недавно созданных и активных контрактов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№ Контракта</TableHead>
                    <TableHead>Культура</TableHead>
                    <TableHead>Объем (т)</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Прогресс</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.id}
                      </TableCell>
                      <TableCell>{contract.crop}</TableCell>
                      <TableCell>{contract.volume.toLocaleString()}</TableCell>
                      <TableCell>{contract.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusBadge[contract.status].variant as
                              | "default"
                              | "success"
                              | "warning"
                          }
                        >
                          {statusBadge[contract.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={contract.progress}
                            className="h-2 w-[60px]"
                          />
                          <span className="text-xs text-muted-foreground">
                            {contract.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/contracts/${contract.id}`}>
                            Подробнее
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <Link href="/contracts">
                  Посмотреть все
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Shipment Status Distribution */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Статус вагонов
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Отгружено</span>
                    </div>
                    <span className="font-medium">42</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">В пути</span>
                    </div>
                    <span className="font-medium">18</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">На элеваторе</span>
                    </div>
                    <span className="font-medium">24</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Ближайшие отгрузки
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Сегодня</span>
                    </div>
                    <span className="font-medium">5 вагонов</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Завтра</span>
                    </div>
                    <span className="font-medium">8 вагонов</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">На этой неделе</span>
                    </div>
                    <span className="font-medium">15 вагонов</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Документы</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileBarChart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Паспорта качества</span>
                    </div>
                    <span className="font-medium">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">ЭПД</span>
                    </div>
                    <span className="font-medium">18</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Требуют внимания</span>
                    </div>
                    <span className="font-medium">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Последние действия</CardTitle>
              <CardDescription>
                История действий пользователей в системе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Действие</TableHead>
                    <TableHead>Контракт</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Время</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>
                        <Link
                          href={`/contracts/${activity.contract}`}
                          className="text-blue-600 hover:underline"
                        >
                          {activity.contract}
                        </Link>
                      </TableCell>
                      <TableCell>{activity.user}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{activity.timestamp}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
