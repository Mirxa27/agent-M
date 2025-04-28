import React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Home, Settings, Users, FileText, Key } from "lucide-react";

export default function LanguageDemoPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language.startsWith("ar");

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gradient">
        {t("app.name")} - {t("settings.language")} {t("dashboard.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.title")}</CardTitle>
            <CardDescription>{t("dashboard.summary")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Home className={isRtl ? "rtl-flip" : ""} />
                <span>{t("dashboard.welcome")}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users />
                <span>{t("agents.title")}</span>
              </div>
              <div className="flex items-center gap-3">
                <Key />
                <span>{t("credentials.title")}</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText />
                <span>{t("files.title")}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              {t("dashboard.viewAll")}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("subscription.title")}</CardTitle>
            <CardDescription>
              {t("subscription.chooseYourPlan")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="monthly">
                  {t("subscription.switchToMonthly")}
                </TabsTrigger>
                <TabsTrigger value="yearly">
                  {t("subscription.switchToYearly")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="monthly">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">
                    {t("subscription.monthlyPrice")}
                  </span>
                  <span className="text-2xl font-bold">199 SAR</span>
                </div>
              </TabsContent>
              <TabsContent value="yearly">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">
                    {t("subscription.yearlyPrice")}
                  </span>
                  <span className="text-2xl font-bold">1,999 SAR</span>
                </div>
                <div className="text-sm text-emerald-600">
                  {t("subscription.saveWithYearly")}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button className="w-full">{t("subscription.subscribe")}</Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.title")}</CardTitle>
          <CardDescription>{t("settings.language")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Globe />
            <div className="flex gap-2">
              <Button
                variant={i18n.language.startsWith("en") ? "default" : "outline"}
                onClick={() => i18n.changeLanguage("en")}
              >
                English
              </Button>
              <Button
                variant={i18n.language.startsWith("ar") ? "default" : "outline"}
                onClick={() => i18n.changeLanguage("ar")}
              >
                العربية
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">
                {t("errors.somethingWentWrong")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("errors.tryAgain")}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">
                {t("credentials.secureStorage")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("files.dragAndDrop")} {t("files.or")}{" "}
                {t("files.browseFiles")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
