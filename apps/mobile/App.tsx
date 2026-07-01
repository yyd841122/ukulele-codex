import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  beginnerChords,
  chordLoopPractice,
  designPrinciples,
  designTokens,
  mvpLesson,
  ukuleleInstrument
} from "@ukulele/shared";
import {
  centsBetween,
  midiToFrequency,
  noteNameToMidi,
  scorePitchEvent,
  summarizePracticeEvents
} from "@ukulele/audio-core";
import {
  ensureMicrophoneAccess,
  getMicrophonePermissionState,
  initialMicrophoneAccessState
} from "./src/audio/expoAudioEngine";
import { createMockTunerFrame } from "./src/audio/mockAudioEngine";
import { useMicrophoneRecorderMonitor } from "./src/audio/useMicrophoneRecorderMonitor";

type Tab = "home" | "tuner" | "metronome" | "chords" | "practice";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "home", label: "今日" },
  { id: "tuner", label: "调音" },
  { id: "metronome", label: "节拍" },
  { id: "chords", label: "和弦" },
  { id: "practice", label: "跟练" }
];

const IN_TUNE_CENTS = 8;
const ACTION_CENTS = 12;

const practiceSuggestions = [
  "先稳住第一拍，右手扫弦不用急。",
  "Am 进入很稳，保持手腕放松。",
  "F 和弦按弦再靠近品丝一点。",
  "G7 收尾清楚，可以升到 75 BPM。"
];

const colors = designTokens.primitive.color;
const successGreen = "#16A34A";
const ukuleleStringLabels = ["G", "C", "E", "A"];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>AI 尤克里里学园</Text>
          <Text style={styles.subtitle}>MVP 互动练习</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>M0</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === "home" && <HomeScreen onStart={() => setActiveTab("practice")} />}
        {activeTab === "tuner" && <TunerScreen />}
        {activeTab === "metronome" && <MetronomeScreen />}
        {activeTab === "chords" && <ChordScreen />}
        {activeTab === "practice" && <PracticeScreen />}
      </ScrollView>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`打开${tab.label}页`}
              accessibilityState={{ selected }}
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabButton, selected && styles.tabButtonActive]}
            >
              <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.stack}>
      <View style={styles.heroBand}>
        <Text style={styles.heroTitle}>{mvpLesson.title}</Text>
        <Text style={styles.heroCopy}>8 分钟完成一次调音、慢速节拍、四和弦循环和模拟报告。</Text>
        <Pressable accessibilityRole="button" onPress={onStart} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>开始 8 分钟练习</Text>
        </Pressable>
      </View>

      <SectionTitle title="今日闭环" detail="本地模拟拾音" />
      <View style={styles.grid}>
        <Metric label="调音状态" value="3/4" />
        <Metric label="目标速度" value={`${chordLoopPractice.bpm} BPM`} />
        <Metric label="和弦组" value="C Am F G7" />
        <Metric label="预计用时" value={`${mvpLesson.estimatedMinutes} 分钟`} />
      </View>

      <SectionTitle title="P0 任务" detail="先把练习闭环跑通" />
      <View style={styles.list}>
        <InfoRow title="标准调弦" detail="G4 C4 E4 A4" />
        <InfoRow title="节拍跟练" detail={`${chordLoopPractice.timeSignature} 慢速循环`} />
        <InfoRow title="练习评分" detail="音准 节奏 连续性" />
      </View>

      <SectionTitle title="体验原则" />
      {designPrinciples.map((principle) => (
        <Text key={principle} style={styles.listItem}>
          {principle}
        </Text>
      ))}
    </View>
  );
}

function TunerScreen() {
  const tuning = ukuleleInstrument.tunings[0];
  const [selectedIndex, setSelectedIndex] = useState(3);
  const [micAccess, setMicAccess] = useState(initialMicrophoneAccessState);
  const [micBusy, setMicBusy] = useState(false);
  const recorderMonitor = useMicrophoneRecorderMonitor();
  const selectedString = tuning.strings[selectedIndex];
  const frame = createMockTunerFrame(tuning.strings, selectedIndex);
  const cents = frame.cents;
  const frameSourceLabel = frame.source === "mock" ? "模拟 PitchFrame" : "真实 PitchFrame";
  const audioInputLabel = recorderMonitor.isRecording ? "真实麦克风电平" : frameSourceLabel;

  useEffect(() => {
    let mounted = true;
    getMicrophonePermissionState().then((state) => {
      if (mounted) {
        setMicAccess(state);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function requestMicrophone() {
    setMicBusy(true);
    try {
      setMicAccess(await ensureMicrophoneAccess());
    } finally {
      setMicBusy(false);
    }
  }

  async function toggleRecorder() {
    if (recorderMonitor.isRecording) {
      await recorderMonitor.stop();
      return;
    }

    const access = await recorderMonitor.start();
    setMicAccess(access);
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title="智能调音器" detail={`${tuning.name} · ${audioInputLabel}`} />
      <View style={styles.micPanel}>
        <View style={styles.micCopy}>
          <Text style={styles.infoTitle}>{micAccess.label}</Text>
          <Text style={styles.infoDetail}>{micAccess.detail}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={micBusy || micAccess.granted || !micAccess.canAskAgain}
          onPress={requestMicrophone}
          style={[
            styles.micButton,
            micAccess.granted && styles.micButtonReady,
            (micBusy || micAccess.granted || !micAccess.canAskAgain) && styles.disabledButton
          ]}
        >
          <Text style={styles.micButtonText}>
            {micBusy ? "请求中" : micAccess.granted ? "已授权" : "启用麦克风"}
          </Text>
        </Pressable>
      </View>
      <View style={styles.tunerDial}>
        <Text style={styles.noteText}>{frame.target.note}</Text>
        <Text style={[styles.centsText, centsTextStyle(cents)]}>
          {tuningActionLabel(cents)}
        </Text>
        <Text style={[styles.statusText, centsTextStyle(cents)]}>{statusLabel(frame.status)}</Text>
        <Text style={styles.sectionDetail}>目标频率 {selectedString.frequencyHz.toFixed(2)} Hz</Text>
        <Text style={styles.sectionDetail}>
          检测 {frame.detectedFrequencyHz.toFixed(2)} Hz · {frameSourceLabel} · confidence {frame.confidence.toFixed(2)}
        </Text>
        <View style={styles.needleTrack}>
          <View style={[styles.needleMark, { transform: [{ translateX: Math.max(-42, Math.min(42, cents * 3.4)) }] }]} />
        </View>
      </View>
      <View style={styles.inputPanel}>
        <View style={styles.inputHeader}>
          <View>
            <Text style={styles.infoTitle}>输入电平</Text>
            <Text style={styles.infoDetail}>
              {recorderMonitor.isRecording
                ? "正在读取真实麦克风电平，PitchFrame 管线已就绪"
                : "启动后可验证真实麦克风权限与输入电平"}
            </Text>
          </View>
          <Text style={styles.levelValue}>{Math.round(recorderMonitor.level * 100)}%</Text>
        </View>
        <View style={styles.levelTrack}>
          <View style={[styles.levelFill, { width: `${Math.round(recorderMonitor.level * 100)}%` }]} />
        </View>
        <View style={styles.inputMetaRow}>
          <Text style={styles.inputMeta}>时长 {Math.round(recorderMonitor.durationMillis / 1000)}s</Text>
          <Text style={styles.inputMeta}>
            metering {recorderMonitor.metering == null ? "--" : recorderMonitor.metering.toFixed(1)}
          </Text>
        </View>
        {recorderMonitor.error ? <Text style={styles.errorText}>{recorderMonitor.error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={recorderMonitor.isBusy}
          onPress={toggleRecorder}
          style={[styles.recorderButton, recorderMonitor.isRecording && styles.recorderButtonStop]}
        >
          <Text style={styles.recorderButtonText}>
            {recorderMonitor.isBusy ? "处理中" : recorderMonitor.isRecording ? "停止录音 PoC" : "开始录音 PoC"}
          </Text>
        </Pressable>
      </View>
      <View style={styles.stringRow}>
        {tuning.strings.map((string, index) => {
          const selected = index === selectedIndex;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`选择${string.note}`}
              accessibilityState={{ selected }}
              key={string.note}
              onPress={() => setSelectedIndex(index)}
              style={[styles.stringButton, selected && styles.stringButtonActive]}
            >
              <Text style={[styles.stringNote, selected && styles.stringNoteActive]}>{string.note}</Text>
              <Text style={styles.frequencyText}>{string.frequencyHz.toFixed(2)} Hz</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MetronomeScreen() {
  const [bpm, setBpm] = useState(chordLoopPractice.bpm);
  const [isRunning, setIsRunning] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const [barCount, setBarCount] = useState(1);
  const beatMs = Math.round(60000 / bpm);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setBeatIndex((current) => {
        const next = (current + 1) % 4;
        if (next === 0) {
          setBarCount((bar) => bar + 1);
        }
        return next;
      });
    }, beatMs);

    return () => clearInterval(timer);
  }, [beatMs, isRunning]);

  return (
    <View style={styles.stack}>
      <SectionTitle title="节拍器" detail={`${chordLoopPractice.timeSignature} · 每拍 ${beatMs} ms`} />
      <View style={styles.metricPanel}>
        <Text style={styles.metricValue}>{bpm}</Text>
        <Text style={styles.metricLabel}>BPM</Text>
        <View style={styles.controlRow}>
          <Pressable
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={() => setBpm((value) => Math.max(30, value - 5))}
          >
            <Text style={styles.secondaryButtonText}>-5</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.primaryInlineButton}
            onPress={() => setIsRunning((value) => !value)}
          >
            <Text style={styles.primaryButtonText}>{isRunning ? "暂停" : "开始"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={() => setBpm((value) => Math.min(240, value + 5))}
          >
            <Text style={styles.secondaryButtonText}>+5</Text>
          </Pressable>
        </View>
      </View>
      <SectionTitle title="Beat Grid" detail={`小节 ${barCount}`} />
      <View style={styles.beatGrid}>
        {[1, 2, 3, 4].map((beat, index) => (
          <View key={beat} style={[styles.beatCell, index === beatIndex && styles.beatAccent]}>
            <Text style={[styles.beatText, index === beatIndex && styles.beatTextActive]}>{beat}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ChordScreen() {
  return (
    <View style={styles.stack}>
      <SectionTitle title="基础和弦" detail="入门四组" />
      {beginnerChords.map((chord) => (
        <View key={chord.id} style={styles.chordCard}>
          <View>
            <Text style={styles.chordName}>{chord.name}</Text>
            <Text style={styles.chordMeta}>难度 {chord.difficulty} · {chord.tags.join(" / ")}</Text>
          </View>
          <View style={styles.fretRow}>
            {chord.fingering.map((fret, index) => (
              <View key={`${chord.id}-${index}`} style={styles.fretCell}>
                <Text style={styles.fretText}>{fret}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function PracticeScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [practiceBpm, setPracticeBpm] = useState(chordLoopPractice.bpm);
  const [practiceBeat, setPracticeBeat] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(() =>
    chordLoopPractice.targets.map(() => false)
  );
  const stepReports = useMemo(() => {
    return chordLoopPractice.targets.map((target, index) => {
      const expectedMidi = noteNameToMidi(target.primaryNote);
      const detectedMidi = index === 2 ? expectedMidi - 1 : expectedMidi;
      const targetHz = midiToFrequency(expectedMidi);
      const detectedHz = midiToFrequency(detectedMidi);
      const cents = centsBetween(detectedHz, targetHz);
      const event = scorePitchEvent({
        expectedMidi,
        detectedMidi,
        cents,
        confidence: index === 2 ? 0.72 : 0.93,
        timingOffsetMs: [-28, 42, 135, 18][index]
      });
      return {
        target,
        event,
        suggestion: practiceSuggestions[index]
      };
    });
  }, []);
  const report = useMemo(() => summarizePracticeEvents(stepReports.map((item) => item.event)), [stepReports]);
  const activeTarget = chordLoopPractice.targets[currentStep];
  const activeReport = stepReports[currentStep];
  const activeChord = getBeginnerChord(activeTarget.chord);
  const completedCount = completedSteps.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / chordLoopPractice.targets.length) * 100);

  useEffect(() => {
    if (!isRunning) return undefined;

    const interval = setInterval(() => {
      setPracticeBeat((value) => {
        const nextBeat = (value + 1) % 4;
        if (nextBeat === 0) {
          setCurrentStep((step) => (step + 1) % chordLoopPractice.targets.length);
        }
        return nextBeat;
      });
    }, 60000 / practiceBpm);

    return () => clearInterval(interval);
  }, [isRunning, practiceBpm]);

  function completeCurrentStep() {
    setCompletedSteps((steps) => steps.map((done, index) => (index === currentStep ? true : done)));
    setPracticeBeat(0);
    if (currentStep === chordLoopPractice.targets.length - 1) {
      setIsRunning(false);
      return;
    }
    setCurrentStep((value) => value + 1);
  }

  function resetPractice() {
    setIsRunning(false);
    setCurrentStep(0);
    setPracticeBeat(0);
    setCompletedSteps(chordLoopPractice.targets.map(() => false));
  }

  function moveToPreviousStep() {
    setPracticeBeat(0);
    setCurrentStep((value) => (value + chordLoopPractice.targets.length - 1) % chordLoopPractice.targets.length);
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title="跟练" detail={`${chordLoopPractice.bpm} BPM · ${chordLoopPractice.timeSignature}`} />
      <View style={styles.practiceSession}>
        <View style={styles.reportHeader}>
          <View>
            <Text style={styles.sessionEyebrow}>当前任务</Text>
            <Text style={styles.sessionTitle}>{activeTarget.chord} · {practiceAction(activeTarget.chord)}</Text>
          </View>
          <Text style={styles.sessionPill}>{isRunning ? "进行中" : "待开始"}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.sessionMeta}>
          已完成 {completedCount}/{chordLoopPractice.targets.length} · 第 {activeTarget.bar} 小节 · 第 {practiceBeat + 1} 拍
        </Text>
        <View style={styles.practiceBeatPanel}>
          <View style={styles.practiceBeatHeader}>
            <Text style={styles.practiceBeatTitle}>跟练节拍</Text>
            <Text style={styles.practiceBeatMeta}>{practiceBpm} BPM · 4/4</Text>
          </View>
          <View style={styles.practiceBeatGrid}>
            {[1, 2, 3, 4].map((beat, index) => (
              <View key={beat} style={[styles.practiceBeatCell, index === practiceBeat && styles.practiceBeatCellActive]}>
                <Text style={[styles.practiceBeatText, index === practiceBeat && styles.practiceBeatTextActive]}>{beat}</Text>
              </View>
            ))}
          </View>
          <View style={styles.bpmAdjustRow}>
            <Pressable
              accessibilityRole="button"
              style={styles.bpmStepButton}
              onPress={() => setPracticeBpm((value) => Math.max(40, value - 5))}
            >
              <Text style={styles.bpmStepText}>-5</Text>
            </Pressable>
            <Text style={styles.practiceBeatHint}>按亮起的拍子扫弦，第一拍稍微重一点</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.bpmStepButton}
              onPress={() => setPracticeBpm((value) => Math.min(140, value + 5))}
            >
              <Text style={styles.bpmStepText}>+5</Text>
            </Pressable>
          </View>
        </View>
        <ChordFingeringGuide chordName={activeTarget.chord} />
      </View>
      <View style={styles.practiceTimeline}>
        {chordLoopPractice.targets.map((target, index) => {
          const active = index === currentStep;
          const completed = completedSteps[index];
          return (
            <View key={target.id} style={[styles.targetBlock, active && styles.targetBlockActive, completed && styles.targetBlockDone]}>
              <View style={styles.barBadge}>
                <Text style={styles.barBadgeText}>{completed ? "✓" : target.bar}</Text>
              </View>
              <View style={styles.targetCopy}>
                <Text style={styles.targetAction}>{practiceAction(target.chord)}</Text>
                <Text style={styles.targetBeat}>第 {target.bar} 小节 · 第 {target.beat} 拍</Text>
              </View>
              <View style={styles.targetChordBox}>
                <Text style={styles.targetChord}>{target.chord}</Text>
                <MiniFingering chordName={target.chord} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.controlRow}>
        <Pressable
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={moveToPreviousStep}
        >
          <Text style={styles.secondaryButtonText}>上一小节</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.primaryInlineButton}
          onPress={() => setIsRunning((value) => !value)}
        >
          <Text style={styles.primaryButtonText}>{isRunning ? "暂停" : "开始"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={completeCurrentStep}
        >
          <Text style={styles.secondaryButtonText}>完成</Text>
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" style={styles.resetButton} onPress={resetPractice}>
        <Text style={styles.resetButtonText}>重置练习</Text>
      </Pressable>

      <View style={styles.reportPanel}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>模拟报告</Text>
          <Text style={styles.reportPill}>第 {activeTarget.bar} 小节</Text>
        </View>
        <View style={styles.reportGrid}>
          <ScoreBox label="完成" value={`${report.completedTargets}/${report.totalTargets}`} />
          <ScoreBox label="准确率" value={`${report.accuracy}%`} />
          <ScoreBox label="音准" value={String(report.averagePitchScore)} />
        </View>
        <Text style={styles.reportLine}>
          本小节：音准 {activeReport.event.pitchScore} · 节奏 {activeReport.event.rhythmScore ?? "--"} · 当前目标 {activeTarget.chord}
        </Text>
        <Text style={styles.reportLine}>
          指法：{activeChord ? activeChord.fingering.join("-") : "--"} · 下次建议：{activeReport.suggestion}
        </Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricCardLabel}>{label}</Text>
      <Text style={styles.metricCardValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoDetail}>{detail}</Text>
    </View>
  );
}

function ScoreBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scoreBox}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  );
}

function ChordFingeringGuide({ chordName }: { chordName: string }) {
  const chord = getBeginnerChord(chordName);
  if (!chord) return null;

  return (
    <View style={styles.fingeringGuide}>
      <ChordDiagram chord={chord} />
      <Text style={styles.fingeringHelp}>只弹 ○ / ● 的弦；× 的弦不弹。● 里的数字是手指编号：1 食指 · 2 中指 · 3 无名指。</Text>
    </View>
  );
}

function ChordDiagram({ chord }: { chord: NonNullable<ReturnType<typeof getBeginnerChord>> }) {
  const fretsToShow = Math.max(4, Math.max(...chord.fingering) + 1);

  return (
    <View style={styles.chordDiagram}>
      <View style={styles.chordBadgeLarge}>
        <Text style={styles.chordBadgeLargeText}>{chord.name}</Text>
      </View>
      <View style={styles.chordBoard}>
        <View style={styles.playMarkerRow}>
          {chord.fingering.map((fret, index) => (
            <Text key={`${chord.id}-marker-${index}`} style={styles.playMarker}>
              {fret < 0 ? "×" : fret === 0 ? "○" : "●"}
            </Text>
          ))}
        </View>
        <View style={styles.boardRow}>
          <View style={styles.fretNumberRail}>
            {Array.from({ length: fretsToShow }, (_, index) => (
              <Text key={`${chord.id}-fret-${index}`} style={styles.fretNumberLabel}>{index + 1}</Text>
            ))}
          </View>
          <View style={styles.fretboard}>
            {ukuleleStringLabels.map((label, index) => (
              <View
                key={`${chord.id}-string-${label}`}
                style={[styles.stringLine, { left: `${(index / (ukuleleStringLabels.length - 1)) * 100}%` }]}
              />
            ))}
            {Array.from({ length: fretsToShow + 1 }, (_, index) => (
              <View
                key={`${chord.id}-line-${index}`}
                style={[styles.fretLine, index === 0 && styles.nutLine, { top: `${(index / fretsToShow) * 100}%` }]}
              />
            ))}
            {chord.fingering.map((fret, index) => {
              if (fret <= 0) return null;
              const finger = chord.fingers[index] || fret;
              return (
                <View
                  key={`${chord.id}-dot-${index}`}
                  style={[
                    styles.fingerDot,
                    {
                      left: `${(index / (ukuleleStringLabels.length - 1)) * 100}%`,
                      top: `${((fret - 0.5) / fretsToShow) * 100}%`
                    }
                  ]}
                >
                  <Text style={styles.fingerDotText}>{finger}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.diagramStringLabels}>
          {ukuleleStringLabels.map((label) => (
            <Text key={`${chord.id}-label-${label}`} style={styles.diagramStringLabel}>{label}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function MiniFingering({ chordName }: { chordName: string }) {
  const chord = getBeginnerChord(chordName);
  if (!chord) return null;

  return (
    <View style={styles.miniFingering}>
      {chord.fingering.map((fret, index) => (
        <Text key={`${chord.id}-mini-${index}`} style={styles.miniFret}>{fret}</Text>
      ))}
    </View>
  );
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
    </View>
  );
}

function getBeginnerChord(chordName: string) {
  return beginnerChords.find((chord) => chord.name === chordName);
}

function statusLabel(status?: string) {
  if (status === "in-tune") return "在允许范围内，保持即可";
  if (status === "close") return "基本准，多拨一次确认";
  if (status === "flat") return "弦太松，请拧紧";
  if (status === "sharp") return "弦太紧，请松弦";
  return "等待拾音";
}

function tuningActionLabel(cents: number) {
  const amount = Math.abs(cents).toFixed(1);
  if (Math.abs(cents) <= IN_TUNE_CENTS) {
    return `已准 ${amount} cents · 不用调`;
  }
  if (Math.abs(cents) <= ACTION_CENTS) {
    return `基本准 ${amount} cents · 先不动`;
  }
  return cents > 0
    ? `偏高 ${amount} cents · 请松弦`
    : `偏低 ${amount} cents · 请拧紧`;
}

function practiceAction(chord: string) {
  if (chord === "C") return "下扫四拍";
  if (chord === "Am") return "换到 Am";
  if (chord === "F") return "换到 F";
  return "收在 G7";
}

function centsTextStyle(cents: number) {
  if (Math.abs(cents) <= IN_TUNE_CENTS) {
    return { color: successGreen };
  }
  if (Math.abs(cents) <= ACTION_CENTS) {
    return { color: colors.amber };
  }
  return { color: cents > 0 ? colors.coral : "#3A6EA5" };
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.paper
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DED6CA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  appName: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.ink
  },
  subtitle: {
    marginTop: 2,
    color: "#6B6258"
  },
  levelBadge: {
    minWidth: 54,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED6CA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  levelBadgeText: {
    color: colors.forest,
    fontWeight: "900"
  },
  content: {
    padding: 20,
    paddingBottom: 112
  },
  stack: {
    gap: 16
  },
  heroBand: {
    backgroundColor: colors.forest,
    borderRadius: 8,
    padding: 20,
    gap: 12
  },
  heroTitle: {
    color: "#FFF8EC",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 31
  },
  heroCopy: {
    color: "#D9E4DB",
    lineHeight: 22
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.amber,
    borderRadius: 8,
    paddingHorizontal: 16
  },
  primaryInlineButton: {
    minHeight: 48,
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.amber,
    paddingHorizontal: 12
  },
  primaryButtonText: {
    color: "#1F2522",
    fontWeight: "800"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink
  },
  sectionDetail: {
    marginTop: 4,
    color: "#756D64"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricCard: {
    width: "48%",
    minHeight: 80,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: "center",
    padding: 14
  },
  metricCardLabel: {
    color: "#756D64"
  },
  metricCardValue: {
    marginTop: 6,
    color: colors.forest,
    fontSize: 20,
    fontWeight: "900"
  },
  list: {
    gap: 10
  },
  infoRow: {
    minHeight: 64,
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  infoTitle: {
    color: colors.forest,
    fontWeight: "900"
  },
  infoDetail: {
    color: "#756D64",
    textAlign: "right",
    flexShrink: 1
  },
  micPanel: {
    minHeight: 76,
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  micCopy: {
    flex: 1,
    gap: 4
  },
  micButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forest,
    paddingHorizontal: 12
  },
  micButtonReady: {
    backgroundColor: colors.amber
  },
  micButtonText: {
    color: "#FFF8EC",
    fontWeight: "900"
  },
  disabledButton: {
    opacity: 0.72
  },
  inputPanel: {
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  levelValue: {
    color: colors.forest,
    fontSize: 24,
    fontWeight: "900"
  },
  levelTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#EEE8DC",
    overflow: "hidden"
  },
  levelFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.amber
  },
  inputMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  inputMeta: {
    color: "#756D64",
    fontSize: 12
  },
  errorText: {
    color: colors.coral,
    fontWeight: "800"
  },
  recorderButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.forest,
    paddingHorizontal: 12
  },
  recorderButtonStop: {
    backgroundColor: colors.coral
  },
  recorderButtonText: {
    color: "#FFF8EC",
    fontWeight: "900"
  },
  listItem: {
    color: "#4C4944",
    lineHeight: 22
  },
  tunerDial: {
    minHeight: 250,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20
  },
  noteText: {
    fontSize: 72,
    fontWeight: "900",
    color: colors.forest
  },
  centsText: {
    fontSize: 20,
    fontWeight: "800"
  },
  statusText: {
    color: "#5E6D62",
    fontWeight: "800"
  },
  needleTrack: {
    marginTop: 14,
    width: "100%",
    height: 4,
    borderRadius: 999,
    backgroundColor: "#DCECE2",
    alignItems: "center",
    justifyContent: "center"
  },
  needleMark: {
    width: 4,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.ink
  },
  stringRow: {
    flexDirection: "row",
    gap: 8
  },
  stringButton: {
    flex: 1,
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9D1C4",
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  stringButtonActive: {
    borderColor: colors.forest,
    backgroundColor: "#E7F1EA"
  },
  stringNote: {
    fontWeight: "900",
    color: "#3B3935"
  },
  stringNoteActive: {
    color: colors.forest
  },
  frequencyText: {
    marginTop: 4,
    fontSize: 11,
    color: "#82786C"
  },
  metricPanel: {
    minHeight: 178,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18
  },
  metricValue: {
    fontSize: 64,
    fontWeight: "900",
    color: colors.forest
  },
  metricLabel: {
    color: "#756D64"
  },
  controlRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  secondaryButton: {
    minHeight: 48,
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC",
    paddingHorizontal: 12
  },
  secondaryButtonText: {
    color: colors.forest,
    fontWeight: "900"
  },
  beatGrid: {
    flexDirection: "row",
    gap: 8
  },
  beatCell: {
    flex: 1,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line
  },
  beatAccent: {
    backgroundColor: colors.forest,
    borderColor: colors.forest
  },
  beatText: {
    fontWeight: "900",
    color: colors.ink
  },
  beatTextActive: {
    color: "#FFF8EC"
  },
  chordCard: {
    minHeight: 84,
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  chordName: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.forest
  },
  chordMeta: {
    marginTop: 3,
    color: "#756D64"
  },
  fretRow: {
    flexDirection: "row",
    gap: 5
  },
  fretCell: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: 6,
    backgroundColor: "#EEE8DC",
    alignItems: "center",
    justifyContent: "center"
  },
  fretText: {
    color: colors.forest,
    fontWeight: "900"
  },
  practiceSession: {
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10
  },
  sessionEyebrow: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "800"
  },
  sessionTitle: {
    marginTop: 3,
    color: colors.forest,
    fontSize: 18,
    fontWeight: "900"
  },
  sessionPill: {
    color: colors.forest,
    backgroundColor: "#DCECE2",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "900"
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#EEE8DC",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: successGreen
  },
  sessionMeta: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "700"
  },
  practiceBeatPanel: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F7F1E7",
    borderWidth: 1,
    borderColor: "#DED6CA",
    gap: 8
  },
  practiceBeatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  practiceBeatTitle: {
    color: colors.forest,
    fontWeight: "900"
  },
  practiceBeatMeta: {
    color: "#756D64",
    fontSize: 12,
    fontWeight: "800"
  },
  practiceBeatGrid: {
    flexDirection: "row",
    gap: 8
  },
  practiceBeatCell: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  practiceBeatCellActive: {
    borderColor: colors.forest,
    backgroundColor: colors.forest
  },
  practiceBeatText: {
    color: colors.forest,
    fontSize: 18,
    fontWeight: "900"
  },
  practiceBeatTextActive: {
    color: "#FFF8EC"
  },
  bpmAdjustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  bpmStepButton: {
    minWidth: 52,
    minHeight: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8DC"
  },
  bpmStepText: {
    color: colors.forest,
    fontWeight: "900"
  },
  practiceBeatHint: {
    flex: 1,
    color: "#756D64",
    fontSize: 12,
    lineHeight: 17
  },
  fingeringGuide: {
    marginTop: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F7F1E7",
    borderWidth: 1,
    borderColor: "#DED6CA",
    gap: 8
  },
  chordDiagram: {
    alignItems: "center"
  },
  chordBadgeLarge: {
    minWidth: 90,
    minHeight: 58,
    marginBottom: -12,
    borderRadius: 24,
    backgroundColor: "#FF8A3D",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1
  },
  chordBadgeLargeText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900"
  },
  chordBoard: {
    width: "100%",
    borderRadius: 18,
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5DFD3"
  },
  playMarkerRow: {
    marginLeft: 34,
    marginRight: 4,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  playMarker: {
    width: 28,
    textAlign: "center",
    color: colors.ink,
    fontSize: 26,
    fontWeight: "800"
  },
  boardRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "stretch"
  },
  fretNumberRail: {
    width: 28,
    height: 210,
    justifyContent: "space-around"
  },
  fretNumberLabel: {
    color: "#A19A91",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  fretboard: {
    flex: 1,
    height: 210,
    position: "relative"
  },
  stringLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: "#697078"
  },
  fretLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    marginTop: -1.5,
    backgroundColor: "#697078"
  },
  nutLine: {
    height: 7,
    marginTop: -3.5,
    backgroundColor: colors.ink
  },
  fingerDot: {
    position: "absolute",
    width: 38,
    height: 38,
    marginLeft: -19,
    marginTop: -19,
    borderRadius: 999,
    backgroundColor: "#FF8A3D",
    alignItems: "center",
    justifyContent: "center"
  },
  fingerDotText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900"
  },
  diagramStringLabels: {
    marginLeft: 34,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  diagramStringLabel: {
    width: 28,
    color: "#A19A91",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800"
  },
  fingeringHelp: {
    color: "#756D64",
    fontSize: 12,
    lineHeight: 17
  },
  practiceTimeline: {
    gap: 10
  },
  targetBlock: {
    minHeight: 72,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  targetBlockActive: {
    backgroundColor: "#FFF4D9",
    borderColor: colors.amber
  },
  targetBlockDone: {
    backgroundColor: "#F0FDF4",
    borderColor: successGreen
  },
  barBadge: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center"
  },
  barBadgeText: {
    color: "#FFF8EC",
    fontWeight: "900"
  },
  targetCopy: {
    flex: 1
  },
  targetAction: {
    color: colors.ink,
    fontWeight: "900"
  },
  targetBeat: {
    marginTop: 3,
    color: "#756D64"
  },
  targetChord: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.forest
  },
  targetChordBox: {
    alignItems: "flex-end",
    gap: 5
  },
  miniFingering: {
    flexDirection: "row",
    gap: 3
  },
  miniFret: {
    minWidth: 18,
    minHeight: 18,
    borderRadius: 5,
    overflow: "hidden",
    textAlign: "center",
    color: colors.forest,
    backgroundColor: "#EEE8DC",
    fontSize: 11,
    fontWeight: "900"
  },
  resetButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4DFDB"
  },
  resetButtonText: {
    color: colors.coral,
    fontWeight: "900"
  },
  reportPanel: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: colors.forest,
    gap: 10
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  reportTitle: {
    color: "#FFF8EC",
    fontSize: 18,
    fontWeight: "900"
  },
  reportPill: {
    color: "#1F2522",
    backgroundColor: colors.amber,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "900"
  },
  reportGrid: {
    flexDirection: "row",
    gap: 8
  },
  scoreBox: {
    flex: 1,
    minHeight: 72,
    borderRadius: 8,
    backgroundColor: "rgba(255, 248, 236, 0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  scoreLabel: {
    color: "#D9E4DB"
  },
  scoreValue: {
    marginTop: 4,
    color: "#FFF8EC",
    fontSize: 20,
    fontWeight: "900"
  },
  reportLine: {
    color: "#D9E4DB",
    lineHeight: 21
  },
  tabBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    gap: 6,
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  tabButtonActive: {
    backgroundColor: colors.forest
  },
  tabLabel: {
    fontWeight: "800",
    color: "#5D574F"
  },
  tabLabelActive: {
    color: "#FFF8EC"
  }
});
