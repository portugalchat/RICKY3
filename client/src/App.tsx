import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { ChatProvider } from "@/contexts/chat-context";
import { ThemeProvider } from "@/contexts/theme-context";
import Landing from "@/pages/landing";
import Chat from "@/pages/chat";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Inbox from "@/pages/inbox";
import PrivateChat from "@/pages/private-chat";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/chat" component={Chat} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/private-chat/:friendId" component={PrivateChat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
