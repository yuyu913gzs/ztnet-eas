import { type ReactElement } from "react";
import { LayoutAuthenticated } from "~/components/layouts/layout";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { toast } from "react-hot-toast";
import InputField from "~/components/elements/inputField";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { globalSiteVersion } from "~/utils/global";
import Link from "next/link";
import GenerateApiToken from "~/components/userSettings/apiToken";
import { languageNames, supportedLocales } from "~/locales/lang";
import ApplicationFontSize from "~/components/userSettings/fontSize";
import TOTPSetup from "~/components/auth/totpSetup";
import { useModalStore } from "~/utils/store";
import DisableTwoFactSetupModal from "~/components/auth/totpDisable";
import MultifactorNotEnabled from "~/components/auth/multifactorNotEnabledAlert";
import MenuSectionWrapper from "~/components/shared/menuSectionWrapper";

const defaultLocale = "en";

const Account = () => {
	const { callModal } = useModalStore((state) => state);
	const { asPath, locale, locales, push } = useRouter();
	const t = useTranslations();

	const { data: me, refetch: refetchMe } = api.auth.me.useQuery();

	const { data: session, update: sessionUpdate } = useSession();
	const { mutate: userUpdate, error: userError } = api.auth.update.useMutation();

	const { mutate: updateZtApi } = api.auth.setZtApi.useMutation({
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const ChangeLanguage = async (locale: string) => {
		if (locale === "default") {
			localStorage.removeItem("ztnet-language");

			// Use navigator.languages for better cross-browser support
			const browserLocales = navigator.languages.map((lang) => lang.split("-")[0]);
			const isLocaleSupported = browserLocales.some((lang) =>
				supportedLocales.includes(lang),
			);
			// Find the first supported locale or fallback to defaultLocale
			const matchedLocale =
				browserLocales.find((lang) => supportedLocales.includes(lang)) || defaultLocale;

			await push(asPath, asPath, {
				locale: isLocaleSupported ? matchedLocale : defaultLocale,
			});
		} else {
			localStorage.setItem("ztnet-language", locale);
			await push(asPath, asPath, { locale });
		}
	};

	if (userError) {
		toast.error(userError.message);
	}

	return (
		<main className="flex w-full flex-col justify-center space-y-10 p-3 sm:w-6/12">
			<MenuSectionWrapper
				title={t("userSettings.account.accountSettings.title").toUpperCase()}
			>
				<InputField
					label={t("userSettings.account.accountSettings.nameLabel")}
					isLoading={!session?.user}
					rootFormClassName="space-y-3 w-3/6"
					size="sm"
					fields={[
						{
							name: "name",
							type: "text",
							placeholder: session?.user?.name,
							value: session?.user?.name,
						},
					]}
					submitHandler={async (params) => await sessionUpdate({ update: { ...params } })}
				/>
				<InputField
					label={t("userSettings.account.accountSettings.emailLabel")}
					isLoading={!session?.user}
					rootFormClassName="space-y-3 w-3/6"
					size="sm"
					// badge={
					// 	session?.user?.emailVerified
					// 		? {
					// 				text: t("userSettings.account.accountSettings.verifiedBadge"),
					// 				color: "success",
					// 		  }
					// 		: {
					// 				text: t("userSettings.account.accountSettings.notVerifiedBadge"),
					// 				color: "warning",
					// 		  }
					// }
					fields={[
						{
							name: "email",
							type: "text",
							placeholder: session?.user?.email,
							value: session?.user?.email,
						},
					]}
					submitHandler={async (params) => await sessionUpdate({ update: { ...params } })}
				/>
				<div className="flex justify-between">
					<div>
						<p className="font-medium">
							{t("userSettings.account.accountSettings.role")}
						</p>
						<p className="text-gray-500">{session?.user?.role}</p>
					</div>
				</div>
			</MenuSectionWrapper>

			<MenuSectionWrapper title="SECURITY">
				<InputField
					isLoading={!session?.user}
					label={t("userSettings.account.accountSettings.passwordLabel")}
					placeholder="******"
					size="sm"
					rootFormClassName="space-y-3 pt-2 w-3/6"
					description="Ensure your account is using a long, random password to stay secure."
					fields={[
						{
							name: "password",
							type: "password",
							placeholder: t(
								"userSettings.account.accountSettings.currentPasswordPlaceholder",
							),
						},
						{
							name: "newPassword",
							type: "password",
							placeholder: t(
								"userSettings.account.accountSettings.newPasswordPlaceholder",
							),
						},
						{
							name: "repeatNewPassword",
							type: "password",
							placeholder: t(
								"userSettings.account.accountSettings.repeatNewPasswordPlaceholder",
							),
						},
					]}
					submitHandler={(params) => {
						return new Promise((resolve, reject) => {
							userUpdate(
								{ ...params },
								{
									onSuccess: () => {
										resolve(true);
									},
									onError: () => {
										reject(false);
									},
								},
							);
						});
					}}
				/>

				{/* TOTP  */}
				<div>{!me?.twoFactorEnabled ? <MultifactorNotEnabled /> : null}</div>

				<div className="flex justify-between">
					<div className="space-y-5">
						<span>
							<p className="text-md font-semibold">
								{t("userSettings.account.totp.title")}
							</p>

							<p className="text-sm text-gray-500">
								{t("userSettings.account.totp.description")}
							</p>
						</span>
						<p className="text-sm text-primary">
							{t("userSettings.account.totp.mfaNote")}
						</p>
					</div>
					<button
						className="btn btn-sm"
						onClick={() =>
							callModal({
								showButtons: false,
								title: t("userSettings.account.totp.totpActivation.title"),
								content: me?.twoFactorEnabled ? (
									<DisableTwoFactSetupModal />
								) : (
									<TOTPSetup />
								),
							})
						}
					>
						{me?.twoFactorEnabled
							? t("commonButtons.disable2fa")
							: t("commonButtons.enable2fa")}
					</button>
				</div>
			</MenuSectionWrapper>
			<MenuSectionWrapper title={t("userSettings.account.restapi.sectionTitle")}>
				<p className="text-sm text-gray-500">
					{t("userSettings.account.restapi.description")}
					<br />
					<Link
						className="link"
						target="_blank"
						href="https://ztnet.network/category/rest-api"
					>
						https://ztnet.network/category/rest-api
					</Link>
				</p>
				<div className="space-y-5">
					<GenerateApiToken />
				</div>
			</MenuSectionWrapper>
			<MenuSectionWrapper
				title={t("userSettings.account.zerotierCentral.title").toUpperCase()}
			>
				<p className="text-sm text-gray-500">
					{t.rich("userSettings.account.zerotierCentral.description", {
						br: () => <br />,
					})}
				</p>
				<InputField
					label="Zerotier Central API Key"
					placeholder="******"
					size="sm"
					rootFormClassName="space-y-3 pt-2 w-3/6"
					fields={[
						{
							name: "ztCentralApiKey",
							type: "text",
							placeholder: "api key",
							value: me?.options?.ztCentralApiKey,
						},
					]}
					submitHandler={(params) => {
						return new Promise((resolve, reject) => {
							updateZtApi(
								{ ...params },
								{
									onSuccess: () => {
										void refetchMe();
										resolve(true);
									},
									onError: () => {
										void refetchMe();
										reject(false);
									},
								},
							);
						});
					}}
				/>
				<InputField
					label={t("userSettings.account.zerotierCentral.apiUrlLabel")}
					description={t("userSettings.account.zerotierCentral.apiUrlLabelDescription")}
					size="sm"
					rootFormClassName="space-y-3 pt-2 w-3/6"
					rootClassName="py-2"
					fields={[
						{
							name: "ztCentralApiUrl",
							type: "text",
							placeholder:
								me?.options?.ztCentralApiUrl || "https://api.zerotier.com/api/v1",
							value: me?.options?.ztCentralApiUrl,
						},
					]}
					submitHandler={(params) => {
						return new Promise((resolve, reject) => {
							updateZtApi(
								{ ...params },
								{
									onSuccess: () => {
										void refetchMe();
										resolve(true);
									},
									onError: () => {
										void refetchMe();
										reject(false);
									},
								},
							);
						});
					}}
				/>
			</MenuSectionWrapper>
			<MenuSectionWrapper title={t("userSettings.account.accountPreferences.title")}>
				<div className="form-control w-full max-w-xs">
					<label className="label">
						<span className="label-text font-medium">
							{t("userSettings.account.accountPreferences.languageLabel")}
						</span>
					</label>
					<select
						defaultValue={locale} // use `defaultValue` here
						onChange={(e) => void ChangeLanguage(e.target.value)}
						className="select select-bordered select-sm"
					>
						{locales.map((language) => (
							<option key={language} value={language}>
								{languageNames[language]}
							</option>
						))}
					</select>
				</div>
				<ApplicationFontSize />
			</MenuSectionWrapper>
			<MenuSectionWrapper title={t("userSettings.account.application.title")}>
				<div className="flex items-center justify-between">
					<p>{t("userSettings.account.application.version")}</p>
					<a
						className="link text-primary"
						href="https://github.com/sinamics/ztnet/releases"
					>
						{globalSiteVersion ?? t("userSettings.account.application.developerMode")}
					</a>
				</div>
			</MenuSectionWrapper>
		</main>
	);
};

Account.getLayout = function getLayout(page: ReactElement) {
	return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default Account;
