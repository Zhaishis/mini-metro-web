import React, {
  Dispatch,
  SetStateAction,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { AutoGrowthInput } from "../../Common/AutoGrowthInput";
import "./Menu.scss";
import classNames from "classnames";
import { FunctionMode, Mode } from "../../DataStructure/Mode";
import {
  ChangeSteps,
  StationProps,
  UserDataType,
  addNewStation,
  addStationFromRecord,
  deleteStation,
  dataProcessor,
  InsertInfo,
  RecordType,
  LineChanges,
  LineProps,
} from "../../Data/UserData";
import PlusIcon from "../../Resource/Icon/plus";
import { exportJson, importFromFile } from "../../Common/util";
import moment from "moment";

type MenuType = {
  setEditingMode: React.Dispatch<React.SetStateAction<Mode>>;
  functionMode: FunctionMode;
  setFunctionMode: React.Dispatch<React.SetStateAction<FunctionMode>>;
  record: RecordType;
  setRecord: React.Dispatch<React.SetStateAction<RecordType>>;
  currentRecordIndex: number;
  setCurrentRecordIndex: React.Dispatch<React.SetStateAction<number>>;
  data: UserDataType;
  setData: Dispatch<SetStateAction<UserDataType>>;
  insertInfo?: InsertInfo;
  setInsertInfo: React.Dispatch<React.SetStateAction<InsertInfo | undefined>>;
  // title: string;
  // setTitle: (title: string|undefined)=>void;
};
export const Menu = forwardRef(function (
  {
    setEditingMode,
    functionMode,
    setFunctionMode,
    record,
    setRecord,
    currentRecordIndex,
    setCurrentRecordIndex,
    data,
    setData,
    insertInfo,
    setInsertInfo,
    // title,
    // setTitle,
  }: MenuType,
  ref
) {
  const [page, setPage] = useState("title");
  const [titleEditable, setTitleEditable] = useState(false);
  const [display, setDisplay] = useState("none");
  const inputRef = useRef<HTMLInputElement>(null);
  const [toolsDisPlay, setToolsDisPlay] = useState("none");
  const undoCondition = currentRecordIndex >= 0;
  const redoCondition = currentRecordIndex < record.length - 1;
  const {title} = data;
  const setTitle = (title: string)=> setData({...data, title})
  const backToTitle = () => {
    setPage("title");
    setTitleEditable(false);
    setFunctionMode(FunctionMode.normal);
  };

  const showTools = (e: React.MouseEvent, functionMode: FunctionMode) => {
    e.stopPropagation();
    setRecord([]);
    setCurrentRecordIndex(-1);
    setFunctionMode(functionMode);
    setTitleEditable(false);
    setToolsDisPlay(window.innerWidth >= 710 ? "inline-block" : "block");
    setTimeout(() => setPage("tools"));
  };
  useImperativeHandle(
    ref,
    () => {
      return {
        backToTitle,
        showTools,
      };
    },
    []
  );
  const tools = () => {
    switch (functionMode) {
      case FunctionMode.addingStation: {
        const stationRecords = record as StationProps[];
        return (
          <>
            <div className="tool disabled">
              {currentRecordIndex >= 0
                ? `已添加${currentRecordIndex + 1}站`
                : "点击空白处新增站点"}
            </div>
            <div
              className={classNames({ tool: 1, disabled: !undoCondition })}
              onClick={(e) => {
                e.stopPropagation();
                if (undoCondition) {
                  const station = stationRecords[currentRecordIndex];
                  const { stationId } = station;
                  deleteStation(data, setData, stationId);
                  setCurrentRecordIndex(currentRecordIndex - 1);
                }
              }}
            >
              撤销
            </div>
            <div
              className={classNames({ tool: 1, disabled: !redoCondition })}
              onClick={(e) => {
                e.stopPropagation();
                if (redoCondition) {
                  const station = stationRecords[currentRecordIndex + 1];
                  addStationFromRecord(data, setData, station);
                  setCurrentRecordIndex(currentRecordIndex + 1);
                }
              }}
            >
              重做
            </div>
            <div
              className="tool"
              onClick={() => {
                setPage("title");
                setTitleEditable(false);
              }}
            >
              完成
            </div>
          </>
        );
      }
      case FunctionMode.dragingStation: {
        const changeRecords = record as ChangeSteps[];
        return (
          <>
            <div className="tool disabled">
              {currentRecordIndex >= 0
                ? `已修改${currentRecordIndex + 1}次`
                : "拖动站点更改位置"}
            </div>
            <div
              className={classNames({ tool: 1, disabled: !undoCondition })}
              onClick={(e) => {
                e.stopPropagation();
                if (undoCondition) {
                  const change = changeRecords[currentRecordIndex];
                  const { stationId, fromX, fromY } = change;
                  const { setStationPosition } = dataProcessor(
                    stationId,
                    setData,
                    data
                  );
                  setStationPosition(fromX, fromY);
                  setCurrentRecordIndex(currentRecordIndex - 1);
                }
              }}
            >
              撤销
            </div>
            <div
              className={classNames({ tool: 1, disabled: !redoCondition })}
              onClick={(e) => {
                e.stopPropagation();
                if (redoCondition) {
                  const change = changeRecords[currentRecordIndex + 1];
                  const { stationId, toX, toY } = change;
                  const { setStationPosition } = dataProcessor(
                    stationId,
                    setData,
                    data
                  );
                  setStationPosition(toX, toY);
                  setCurrentRecordIndex(currentRecordIndex + 1);
                }
              }}
            >
              重做
            </div>
            <div
              className="tool"
              onClick={() => {
                setPage("title");
                setTitleEditable(false);
              }}
            >
              完成
            </div>
          </>
        );
      }
      case FunctionMode.lineEditing: {
        return (
          <>
            <div className="tool disabled">
              先选择一条线路，再点击线路卡片上的“
              <PlusIcon className="tool-plus" />”
            </div>
            <div
              className="tool"
              onClick={() => {
                setPage("title");
                setTitleEditable(false);
              }}
            >
              完成
            </div>
          </>
        );
      }
      case FunctionMode.selectingStation: {
        const { insertIndex, line } = insertInfo!;
        const { lineName } = line;
        const changeRecords = record as LineChanges[];

        return (
          <>
            <div className="tool disabled">
              点击站点将它插入到{lineName}的第{insertIndex + 1}站
            </div>
            <div
              className={classNames({ tool: 1, disabled: !undoCondition })}
              onClick={(e) => {
                e.stopPropagation();
                if (undoCondition) {
                  const change = changeRecords[currentRecordIndex];
                  const { stationId, lineId, stationIndex } = change;
                  const { removeStationFromLine } = dataProcessor(
                    stationId,
                    setData,
                    data
                  );
                  removeStationFromLine(lineId, stationIndex);
                  setInsertInfo({
                    insertIndex: insertIndex === 0 ? 0 : insertIndex - 1,
                    line,
                  });
                  setCurrentRecordIndex(currentRecordIndex - 1);
                }
              }}
            >
              撤销
            </div>
            <div
              className={classNames({ tool: 1, disabled: !redoCondition })}
              onClick={(e) => {
                e.stopPropagation();
                if (redoCondition) {
                  const change = changeRecords[currentRecordIndex + 1];
                  const { stationId, lineId, stationIndex } = change;
                  const { addStationToLine } = dataProcessor(
                    lineId,
                    setData,
                    data
                  );
                  addStationToLine(stationId, stationIndex);
                  setCurrentRecordIndex(currentRecordIndex + 1);
                  setInsertInfo({
                    insertIndex: insertIndex === 0 ? 0 : insertIndex + 1,
                    line,
                  });
                }
              }}
            >
              重做
            </div>
            <div
              className="tool"
              onClick={() => {
                setPage("title");
                setTitleEditable(false);
                setInsertInfo({ insertIndex: -1, line });
              }}
            >
              完成
            </div>
          </>
        );
      }
    }
  };
  return (
    <div
      className={classNames({ menu: 1, [`page-${page}`]: 1 })}
      onClick={backToTitle}
      onTransitionEnd={() => {
        if (page === "title" || page === "tools") setDisplay("none");
      }}
    >
      <div className="title" onClick={(e) => e.stopPropagation()}>
        <AutoGrowthInput
          value={title}
          onClick={(e) => {
            e.stopPropagation();
            if (page === "title" || page === "tools") {
              setDisplay("block");
              setTimeout(() => setPage("menu"));
              setTitleEditable(true);
            }
          }}
          onInput={(e) => setTitle(e.currentTarget.value)}
          ref={inputRef}
          style={{
            cursor:
              page === "title"
                ? "pointer"
                : page === "tools"
                ? "default"
                : titleEditable
                ? "auto"
                : "default",
          }}
          disabled={!titleEditable}
        />

        <div
          className="tools"
          style={{ display: toolsDisPlay }}
          onTransitionEnd={() => {
            if (page !== "tools") {
              setToolsDisPlay("none");
              setFunctionMode(FunctionMode.normal);
            }
          }}
        >
          {tools()}
        </div>
      </div>

      <div className="dots" style={{ display }}></div>
      <div className="menus" style={{ display }}>
        <div className="columns">
          <div className="column">
            <div className="column-title">站点</div>
            <div className="column-items">
              <div
                className="column-item"
                onClick={(e) => showTools(e, FunctionMode.addingStation)}
              >
                添加站点...
              </div>
              <div
                className="column-item"
                onClick={(e) => showTools(e, FunctionMode.dragingStation)}
              >
                调整站点位置...
              </div>
              <div className="column-item">隐藏站点名称...</div>
            </div>
          </div>
          <div className="column">
            <div className="column-title">线路</div>
            <div className="column-items">
              <div
                className="column-item"
                onClick={(e) => showTools(e, FunctionMode.lineEditing)}
              >
                插入站点...
              </div>
            </div>
          </div>
          <div className="column">
            <div className="column-title">数据</div>
            <div className="column-items">
              <div className="column-item">新建空白地图...</div>
              <div className="column-item">从已有地图新建...</div>
              <div
                className="column-item"
                onClick={(e) => {
                  e.stopPropagation();
                  importFromFile().then((res) => {
                    const {
                      stations: stationsArr,
                      lines: linesArr,
                      title
                    }: { stations: StationProps[]; lines: LineProps[]; title: string } = res;
                    const stations = stationsArr.reduce((map, cur) => {
                      map.set(cur.stationId, cur);
                      return map;
                    }, new Map());
                    const lines = linesArr.reduce((map, cur) => {
                      map.set(cur.lineId, cur);
                      return map;
                    }, new Map());
                    setData({stations,lines});
                    if(title)setTitle(title);
                  });
                }}
              >
                导入文件...
              </div>
              <div className="column-item">作为图片导出...</div>
              <div className="column-item">作为矢量图片导出...</div>
              <div
                className="column-item"
                onClick={(e) => {
                  e.stopPropagation();
                  const current = localStorage.getItem("current");
                  exportJson(
                    current!,
                    `${title}-${moment().format("YYYY-MM-DD_HH-mm-ss")}.json`
                  );
                }}
              >
                作为文件导出...
              </div>
              <div
                className="column-item"
                onClick={(e) => {
                  e.stopPropagation();
                  const current = localStorage.getItem("last");
                  exportJson(
                    current!,
                    `${title}-recovery-${moment().format(
                      "YYYY-MM-DD_HH-mm-ss"
                    )}.json`
                  );
                }}
              >
                恢复数据...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
