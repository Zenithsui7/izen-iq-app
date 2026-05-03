import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import questionsRouter from "./questions";
import testsRouter from "./tests";
import leaderboardRouter from "./leaderboard";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(questionsRouter);
router.use(testsRouter);
router.use(leaderboardRouter);
router.use(statsRouter);

export default router;
